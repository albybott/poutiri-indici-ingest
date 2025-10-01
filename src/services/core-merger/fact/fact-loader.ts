/**
 * Fact Loader
 * Orchestrates loading of facts with foreign key resolution
 */

import type { Pool } from "pg";
import { ForeignKeyResolver } from "./foreign-key-resolver";
import type {
  FactHandlerConfig,
  FactLoadOptions,
  FactLoadResult,
  FactError,
  ResolvedFactRecord,
  ResolvedForeignKey,
  FactType,
} from "../types/fact";
import type { DimensionType } from "../types/scd2";
import type { LineageMetadata } from "../types/scd2";
import { logger } from "../../../utils/logger";

export class FactLoader {
  private pool: Pool;
  private config: FactHandlerConfig;
  private fkResolver: ForeignKeyResolver;

  constructor(
    pool: Pool,
    config: FactHandlerConfig,
    fkResolver: ForeignKeyResolver
  ) {
    this.pool = pool;
    this.config = config;
    this.fkResolver = fkResolver;
  }

  /**
   * Load facts from staging
   */
  async loadFacts(options: FactLoadOptions): Promise<FactLoadResult> {
    const startTime = Date.now();
    const factType = this.config.factType;

    logger.info(`Starting ${factType} fact load`, {
      loadRunId: options.loadRunId,
      extractType: options.extractType,
    });

    const result: FactLoadResult = {
      factType,
      extractType: options.extractType,
      totalRowsRead: 0,
      recordsInserted: 0,
      recordsUpdated: 0,
      recordsSkipped: 0,
      successfulBatches: 0,
      failedBatches: 0,
      durationMs: 0,
      rowsPerSecond: 0,
      memoryUsageMB: 0,
      errors: [],
      warnings: [],
      missingFKSummary: new Map(),
    };

    const client = await this.pool.connect();

    try {
      // Start transaction
      await client.query("BEGIN");

      // Read staging data
      const stagingRecords = await this.readStagingData(
        client,
        options.loadRunId
      );

      result.totalRowsRead = stagingRecords.length;

      if (stagingRecords.length === 0) {
        logger.warn(`No staging records found for ${factType}`, {
          loadRunId: options.loadRunId,
        });
        await client.query("COMMIT");
        return result;
      }

      // Process records in batches
      const batchSize = options.batchSize ?? 1000;
      const batches = this.createBatches(stagingRecords, batchSize);

      for (const batch of batches) {
        try {
          const batchResult = await this.processBatch(client, batch, options);

          result.recordsInserted += batchResult.inserted;
          result.recordsUpdated += batchResult.updated;
          result.recordsSkipped += batchResult.skipped;
          result.errors.push(...batchResult.errors);
          result.warnings.push(...batchResult.warnings);

          // Merge missing FK summaries
          for (const [dimType, count] of batchResult.missingFKs.entries()) {
            const currentCount = result.missingFKSummary.get(dimType) ?? 0;
            result.missingFKSummary.set(dimType, currentCount + count);
          }

          result.successfulBatches++;
        } catch (error) {
          result.failedBatches++;
          const errorMsg =
            error instanceof Error ? error.message : String(error);
          logger.error(`Batch processing failed for ${factType}`, {
            error: errorMsg,
          });

          result.errors.push({
            errorType: "database_error",
            message: `Batch processing failed: ${errorMsg}`,
            stack: error instanceof Error ? error.stack : undefined,
          });

          if (!options.continueOnError) {
            throw error;
          }
        }
      }

      // Commit transaction
      if (!options.dryRun) {
        await client.query("COMMIT");
        logger.info(`Committed ${factType} fact changes`);
      } else {
        await client.query("ROLLBACK");
        logger.info(`Dry run - rolled back ${factType} changes`);
      }
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    // Calculate metrics
    const endTime = Date.now();
    result.durationMs = endTime - startTime;
    result.rowsPerSecond =
      result.durationMs > 0
        ? (result.totalRowsRead / result.durationMs) * 1000
        : 0;
    result.memoryUsageMB = process.memoryUsage().heapUsed / 1024 / 1024;

    logger.info(`Completed ${factType} fact load`, {
      totalRows: result.totalRowsRead,
      inserted: result.recordsInserted,
      updated: result.recordsUpdated,
      skipped: result.recordsSkipped,
      errors: result.errors.length,
      durationMs: result.durationMs,
    });

    // Log missing FK summary
    if (result.missingFKSummary.size > 0) {
      logger.warn(`Missing foreign keys summary for ${factType}`, {
        missingFKs: Object.fromEntries(result.missingFKSummary),
      });
    }

    return result;
  }

  /**
   * Read staging data
   */
  private async readStagingData(
    client: any,
    loadRunId: string
  ): Promise<Record<string, unknown>[]> {
    const columns = this.getAllColumns();
    const query = `
      SELECT ${columns.join(", ")}
      FROM ${this.config.sourceTable}
      WHERE load_run_id = $1
      ORDER BY ${this.config.businessKeyFields.map((f) => this.toSnakeCase(f)).join(", ")}
    `;

    const result = await client.query(query, [loadRunId]);
    return result.rows;
  }

  /**
   * Process a batch of staging records
   */
  private async processBatch(
    client: any,
    batch: Record<string, unknown>[],
    options: FactLoadOptions
  ): Promise<{
    inserted: number;
    updated: number;
    skipped: number;
    errors: FactError[];
    warnings: string[];
    missingFKs: Map<DimensionType, number>;
  }> {
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    const errors: FactError[] = [];
    const warnings: string[] = [];
    const missingFKs = new Map<DimensionType, number>();

    for (const stagingRecord of batch) {
      try {
        // Validate business key
        const businessKey = this.extractBusinessKey(stagingRecord);
        const validation = this.validateBusinessKey(businessKey);
        if (!validation.valid) {
          errors.push({
            errorType: "business_key_conflict",
            message: `Invalid business key: ${validation.missingFields.join(", ")}`,
            businessKey,
          });
          skipped++;
          continue;
        }

        // Resolve foreign keys
        const resolved = await this.resolveForeignKeys(stagingRecord);

        // Check if we can insert this record
        if (!resolved.canInsert) {
          logger.debug(`Skipping fact record: ${resolved.skipReason}`, {
            businessKey,
          });
          skipped++;

          // Track missing FKs
          for (const dimType of resolved.missingRequiredFKs) {
            const count = missingFKs.get(dimType) ?? 0;
            missingFKs.set(dimType, count + 1);
          }

          continue;
        }

        // Build fact record for insertion
        const factRecord = this.buildFactRecord(resolved, stagingRecord);

        // Insert or upsert
        const upsertMode = options.upsertMode ?? "upsert";
        if (upsertMode === "upsert") {
          const isUpdate = await this.recordExists(client, businessKey);
          if (isUpdate) {
            await this.updateFact(client, factRecord);
            updated++;
          } else {
            await this.insertFact(client, factRecord);
            inserted++;
          }
        } else if (upsertMode === "insert") {
          await this.insertFact(client, factRecord);
          inserted++;
        } else {
          await this.updateFact(client, factRecord);
          updated++;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push({
          errorType: "transformation_error",
          message: errorMsg,
          stack: error instanceof Error ? error.stack : undefined,
        });
        skipped++;
      }
    }

    return { inserted, updated, skipped, errors, warnings, missingFKs };
  }

  /**
   * Resolve foreign keys for a staging record
   */
  private async resolveForeignKeys(
    stagingRecord: Record<string, unknown>
  ): Promise<ResolvedFactRecord> {
    const resolvedFKs = new Map<DimensionType, ResolvedForeignKey>();
    const missingRequiredFKs: DimensionType[] = [];
    let skipReason: string | undefined;

    for (const fkRelationship of this.config.foreignKeyRelationships) {
      // Extract business key for dimension lookup
      const dimBusinessKey: Record<string, unknown> = {};
      for (const field of fkRelationship.lookupFields) {
        dimBusinessKey[field] = stagingRecord[field];
      }

      // Resolve FK
      const resolved = await this.fkResolver.resolveForeignKey(
        fkRelationship.dimensionType,
        dimBusinessKey
      );

      resolvedFKs.set(fkRelationship.dimensionType, resolved);

      // Handle missing FK based on strategy
      if (!resolved.found) {
        if (fkRelationship.required) {
          if (fkRelationship.missingStrategy === "error") {
            throw new Error(
              `Required dimension ${fkRelationship.dimensionType} not found: ${JSON.stringify(dimBusinessKey)}`
            );
          } else if (fkRelationship.missingStrategy === "skip") {
            missingRequiredFKs.push(fkRelationship.dimensionType);
            skipReason = `Missing required dimension: ${fkRelationship.dimensionType}`;
          }
        }
      }
    }

    const canInsert = missingRequiredFKs.length === 0;

    return {
      stagingData: stagingRecord,
      resolvedFKs,
      allFKsResolved: canInsert,
      missingRequiredFKs,
      attributes: stagingRecord,
      canInsert,
      skipReason,
    };
  }

  /**
   * Build fact record for insertion
   */
  private buildFactRecord(
    resolved: ResolvedFactRecord,
    stagingRecord: Record<string, unknown>
  ): Record<string, unknown> {
    const factRecord: Record<string, unknown> = {};

    // Add business keys
    for (const field of this.config.businessKeyFields) {
      factRecord[this.toSnakeCase(field)] = stagingRecord[field];
    }

    // Add foreign keys
    for (const [dimType, resolvedFK] of resolved.resolvedFKs.entries()) {
      const fkRelationship = this.config.foreignKeyRelationships.find(
        (r) => r.dimensionType === dimType
      );
      if (fkRelationship) {
        factRecord[fkRelationship.factColumn] = resolvedFK.surrogateKey;
      }
    }

    // Add attributes from field mappings
    for (const mapping of this.config.fieldMappings) {
      const value = stagingRecord[mapping.sourceField];
      const transformedValue = mapping.transform
        ? mapping.transform(value)
        : value;
      factRecord[this.toSnakeCase(mapping.targetField)] =
        transformedValue ?? mapping.defaultValue ?? null;
    }

    // Add lineage
    factRecord.s3_version_id = stagingRecord.s3_version_id;
    factRecord.file_hash = stagingRecord.file_hash;
    factRecord.date_extracted = stagingRecord.date_extracted;
    factRecord.load_run_id = stagingRecord.load_run_id;
    factRecord.load_ts = new Date();

    return factRecord;
  }

  /**
   * Insert fact record
   */
  private async insertFact(
    client: any,
    factRecord: Record<string, unknown>
  ): Promise<void> {
    const columns = Object.keys(factRecord);
    const placeholders = columns.map((_, idx) => `$${idx + 1}`);
    const values = columns.map((col) => factRecord[col]);

    const query = `
      INSERT INTO ${this.config.targetTable} (${columns.join(", ")})
      VALUES (${placeholders.join(", ")})
    `;

    await client.query(query, values);
  }

  /**
   * Update fact record
   */
  private async updateFact(
    client: any,
    factRecord: Record<string, unknown>
  ): Promise<void> {
    const businessKeyFields = this.config.businessKeyFields.map((f) =>
      this.toSnakeCase(f)
    );

    // Build SET clause (exclude business keys)
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    for (const [column, value] of Object.entries(factRecord)) {
      if (!businessKeyFields.includes(column)) {
        setClauses.push(`${column} = $${paramIndex++}`);
        values.push(value);
      }
    }

    // Build WHERE clause
    const whereConditions = businessKeyFields.map(
      (field) => `${field} = $${paramIndex++}`
    );
    for (const field of businessKeyFields) {
      values.push(factRecord[field]);
    }

    const query = `
      UPDATE ${this.config.targetTable}
      SET ${setClauses.join(", ")}
      WHERE ${whereConditions.join(" AND ")}
    `;

    await client.query(query, values);
  }

  /**
   * Check if record exists
   */
  private async recordExists(
    client: any,
    businessKey: Record<string, unknown>
  ): Promise<boolean> {
    const whereConditions = this.config.businessKeyFields.map(
      (field, idx) => `${this.toSnakeCase(field)} = $${idx + 1}`
    );
    const values = this.config.businessKeyFields.map(
      (field) => businessKey[field]
    );

    const query = `
      SELECT 1
      FROM ${this.config.targetTable}
      WHERE ${whereConditions.join(" AND ")}
      LIMIT 1
    `;

    const result = await client.query(query, values);
    return result.rows.length > 0;
  }

  /**
   * Extract business key from record
   */
  private extractBusinessKey(
    record: Record<string, unknown>
  ): Record<string, unknown> {
    const businessKey: Record<string, unknown> = {};
    for (const field of this.config.businessKeyFields) {
      businessKey[field] = record[field];
    }
    return businessKey;
  }

  /**
   * Validate business key
   */
  private validateBusinessKey(businessKey: Record<string, unknown>): {
    valid: boolean;
    missingFields: string[];
  } {
    const missingFields: string[] = [];

    for (const field of this.config.businessKeyFields) {
      const value = businessKey[field];
      if (value === null || value === undefined || value === "") {
        missingFields.push(field);
      }
    }

    return {
      valid: missingFields.length === 0,
      missingFields,
    };
  }

  /**
   * Get all columns to select from staging
   */
  private getAllColumns(): string[] {
    const columns = new Set<string>();

    // Business keys
    for (const field of this.config.businessKeyFields) {
      columns.add(this.toSnakeCase(field));
    }

    // FK lookup fields
    for (const fk of this.config.foreignKeyRelationships) {
      for (const field of fk.lookupFields) {
        columns.add(this.toSnakeCase(field));
      }
    }

    // Field mappings
    for (const mapping of this.config.fieldMappings) {
      columns.add(this.toSnakeCase(mapping.sourceField));
    }

    // Lineage fields
    columns.add("s3_version_id");
    columns.add("file_hash");
    columns.add("date_extracted");
    columns.add("load_run_id");

    return Array.from(columns);
  }

  /**
   * Create batches from array
   */
  private createBatches<T>(array: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Convert camelCase to snake_case
   */
  private toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }

  /**
   * Get fact type
   */
  getFactType(): FactType {
    return this.config.factType;
  }

  /**
   * Get configuration
   */
  getConfig(): FactHandlerConfig {
    return this.config;
  }
}
