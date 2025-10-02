/**
 * Foreign Key Resolver
 * Handles dimension lookups and FK resolution for fact loading
 * Implements caching for performance
 */

import type { Pool } from "pg";
import { DimensionType } from "../types/scd2";
import type { DimensionCacheEntry } from "../types/dimension";
import type { ResolvedForeignKey } from "../types/fact";
import { logger } from "../../../shared/utils/logger";
import { businessKeyToString } from "../utils/business-key-utils";

export class ForeignKeyResolver {
  private pool: Pool;
  private cache: Map<string, DimensionCacheEntry>;
  private cacheEnabled: boolean;
  private cacheMaxSize: number;
  private cacheTtlMs: number;
  private cacheLastRefresh: Date;

  constructor(
    pool: Pool,
    cacheEnabled: boolean = true,
    cacheMaxSize: number = 1000000,
    cacheTtlMs: number = 300000 // 5 minutes
  ) {
    this.pool = pool;
    this.cache = new Map();
    this.cacheEnabled = cacheEnabled;
    this.cacheMaxSize = cacheMaxSize;
    this.cacheTtlMs = cacheTtlMs;
    this.cacheLastRefresh = new Date();
  }

  /**
   * Resolve foreign key by looking up dimension
   */
  async resolveForeignKey(
    dimensionType: DimensionType,
    businessKey: Record<string, unknown>
  ): Promise<ResolvedForeignKey> {
    const cacheKey = this.buildCacheKey(dimensionType, businessKey);

    // Try cache first
    if (this.cacheEnabled) {
      const cached = this.cache.get(cacheKey);
      if (cached && this.isCacheEntryValid(cached)) {
        return {
          dimensionType,
          businessKey,
          surrogateKey: cached.surrogateKey,
          found: true,
          lookedUpAt: new Date(),
        };
      }
    }

    // Lookup in database
    const surrogateKey = await this.lookupDimension(dimensionType, businessKey);

    // Cache result
    if (this.cacheEnabled && surrogateKey !== null) {
      this.addToCache(dimensionType, businessKey, surrogateKey);
    }

    return {
      dimensionType,
      businessKey,
      surrogateKey,
      found: surrogateKey !== null,
      lookedUpAt: new Date(),
    };
  }

  /**
   * Resolve multiple foreign keys
   */
  async resolveMultipleForeignKeys(
    requests: Array<{
      dimensionType: DimensionType;
      businessKey: Record<string, unknown>;
    }>
  ): Promise<Map<DimensionType, ResolvedForeignKey>> {
    const resolved = new Map<DimensionType, ResolvedForeignKey>();

    for (const request of requests) {
      const result = await this.resolveForeignKey(
        request.dimensionType,
        request.businessKey
      );
      resolved.set(request.dimensionType, result);
    }

    return resolved;
  }

  /**
   * Lookup dimension in database
   */
  private async lookupDimension(
    dimensionType: DimensionType,
    businessKey: Record<string, unknown>
  ): Promise<number | null> {
    const tableName = this.getDimensionTableName(dimensionType);
    const businessKeyFields = this.getBusinessKeyFields(dimensionType);

    // Build WHERE clause
    const whereConditions = businessKeyFields.map(
      (field, idx) => `${this.toSnakeCase(field)} = $${idx + 1}`
    );
    whereConditions.push("is_current = true");

    const query = `
      SELECT ${this.toSnakeCase(dimensionType)}_key
      FROM ${tableName}
      WHERE ${whereConditions.join(" AND ")}
      LIMIT 1
    `;

    const params = businessKeyFields.map((field) => businessKey[field]);

    try {
      const result = await this.pool.query(query, params);

      if (result.rows.length === 0) {
        logger.debug(`Dimension not found: ${dimensionType}`, {
          businessKey,
        });
        return null;
      }

      const surrogateKey =
        result.rows[0][`${this.toSnakeCase(dimensionType)}_key`];
      return surrogateKey;
    } catch (error) {
      logger.error(`Error looking up dimension: ${dimensionType}`, {
        businessKey,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Pre-load dimensions into cache
   */
  async preloadCache(dimensionType?: DimensionType): Promise<number> {
    if (!this.cacheEnabled) {
      return 0;
    }

    const dimensionTypes = dimensionType
      ? [dimensionType]
      : [
          DimensionType.PATIENT,
          DimensionType.PROVIDER,
          DimensionType.PRACTICE,
          DimensionType.VACCINE,
          DimensionType.MEDICINE,
        ];

    let totalLoaded = 0;

    for (const dimType of dimensionTypes) {
      try {
        const count = await this.preloadDimensionType(dimType);
        totalLoaded += count;
        logger.info(`Preloaded ${count} ${dimType} dimensions into cache`);
      } catch (error) {
        logger.error(`Error preloading ${dimType} dimensions`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    this.cacheLastRefresh = new Date();
    return totalLoaded;
  }

  /**
   * Preload specific dimension type into cache
   */
  private async preloadDimensionType(
    dimensionType: DimensionType
  ): Promise<number> {
    const tableName = this.getDimensionTableName(dimensionType);
    const businessKeyFields = this.getBusinessKeyFields(dimensionType);
    const keyField = `${this.toSnakeCase(dimensionType)}_key`;

    const selectFields = [
      keyField,
      ...businessKeyFields.map((f) => this.toSnakeCase(f)),
      "effective_from",
      "effective_to",
      "is_current",
    ];

    const query = `
      SELECT ${selectFields.join(", ")}
      FROM ${tableName}
      WHERE is_current = true
      ORDER BY ${keyField}
    `;

    const result = await this.pool.query(query);
    let loaded = 0;

    for (const row of result.rows) {
      // Extract business key
      const businessKey: Record<string, unknown> = {};
      for (const field of businessKeyFields) {
        businessKey[field] = row[this.toSnakeCase(field)];
      }

      // Add to cache
      const cacheEntry: DimensionCacheEntry = {
        dimensionType,
        businessKey,
        surrogateKey: row[keyField],
        isCurrent: row.is_current,
        effectiveFrom: row.effective_from,
        effectiveTo: row.effective_to,
        cachedAt: new Date(),
      };

      const cacheKey = this.buildCacheKey(dimensionType, businessKey);
      this.cache.set(cacheKey, cacheEntry);
      loaded++;

      // Check cache size limit
      if (this.cache.size >= this.cacheMaxSize) {
        logger.warn(
          `Cache size limit reached (${this.cacheMaxSize}), stopping preload`
        );
        break;
      }
    }

    return loaded;
  }

  /**
   * Add entry to cache
   */
  private addToCache(
    dimensionType: DimensionType,
    businessKey: Record<string, unknown>,
    surrogateKey: number
  ): void {
    const cacheKey = this.buildCacheKey(dimensionType, businessKey);
    const entry: DimensionCacheEntry = {
      dimensionType,
      businessKey,
      surrogateKey,
      isCurrent: true,
      effectiveFrom: new Date(),
      effectiveTo: null,
      cachedAt: new Date(),
    };

    this.cache.set(cacheKey, entry);

    // Evict oldest entries if cache is full
    if (this.cache.size > this.cacheMaxSize) {
      const entriesToRemove = this.cache.size - this.cacheMaxSize;
      const keys = Array.from(this.cache.keys());
      for (let i = 0; i < entriesToRemove; i++) {
        this.cache.delete(keys[i]);
      }
    }
  }

  /**
   * Build cache key
   */
  private buildCacheKey(
    dimensionType: DimensionType,
    businessKey: Record<string, unknown>
  ): string {
    const keyString = businessKeyToString(businessKey);
    return `${dimensionType}:${keyString}`;
  }

  /**
   * Check if cache entry is still valid
   */
  private isCacheEntryValid(entry: DimensionCacheEntry): boolean {
    const now = new Date();
    const age = now.getTime() - entry.cachedAt.getTime();
    return age < this.cacheTtlMs;
  }

  /**
   * Clear cache
   */
  clearCache(dimensionType?: DimensionType): void {
    if (dimensionType) {
      // Clear specific dimension type
      const keysToDelete: string[] = [];
      for (const [key, entry] of this.cache.entries()) {
        if (entry.dimensionType === dimensionType) {
          keysToDelete.push(key);
        }
      }
      for (const key of keysToDelete) {
        this.cache.delete(key);
      }
      logger.info(`Cleared cache for ${dimensionType}`);
    } else {
      // Clear all
      this.cache.clear();
      logger.info("Cleared entire dimension cache");
    }
  }

  /**
   * Refresh cache (clear and reload)
   */
  async refreshCache(dimensionType?: DimensionType): Promise<number> {
    this.clearCache(dimensionType);
    return await this.preloadCache(dimensionType);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    enabled: boolean;
    lastRefresh: Date;
    hitRate?: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.cacheMaxSize,
      enabled: this.cacheEnabled,
      lastRefresh: this.cacheLastRefresh,
    };
  }

  /**
   * Get dimension table name
   */
  private getDimensionTableName(dimensionType: DimensionType): string {
    return `core.${dimensionType}`;
  }

  /**
   * Get business key fields for dimension type
   */
  private getBusinessKeyFields(dimensionType: DimensionType): string[] {
    const fields: Record<DimensionType, string[]> = {
      [DimensionType.PATIENT]: ["patientId", "practiceId", "perOrgId"],
      [DimensionType.PROVIDER]: ["providerId", "practiceId", "perOrgId"],
      [DimensionType.PRACTICE]: ["practiceId", "perOrgId"],
      [DimensionType.VACCINE]: ["vaccineId", "practiceId", "perOrgId"],
      [DimensionType.MEDICINE]: ["medicineId", "practiceId", "perOrgId"],
    };

    return fields[dimensionType];
  }

  /**
   * Convert camelCase to snake_case
   */
  private toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }
}
