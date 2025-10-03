/**
 * Fact Loader
 * Orchestrates loading of facts with foreign key resolution
 */

import type { Pool } from "pg";
import { ForeignKeyResolver } from "@/services/core-merger/fact/foreign-key-resolver";
import type {
  FactHandlerConfig,
  FactLoadOptions,
  FactLoadResult,
  FactError,
  ResolvedFactRecord,
  ResolvedForeignKey,
  FactType,
} from "@/services/core-merger/types/fact";
import type { DimensionType } from "@/services/core-merger/types/scd2";
import { logger } from "@/shared/utils/logger";

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

      // Process records in batches for better memory management and transaction control
      // Default batch size of 1000 records balances memory usage with transaction efficiency
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

    // Calculate performance metrics
    const endTime = Date.now();
    result.durationMs = endTime - startTime;
    // Calculate throughput: (rows / milliseconds) * 1000 = rows per second
    result.rowsPerSecond = Math.round(
      result.durationMs > 0
        ? (result.totalRowsRead / result.durationMs) * 1000
        : 0
    );
    // Convert bytes to MB: heapUsed / 1024 / 1024
    result.memoryUsageMB = Math.round(
      process.memoryUsage().heapUsed / 1024 / 1024
    );

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
    const stagingColumns = this.getAllColumns()
      .filter((col) => col !== "load_run_id")
      .map((col) => `stg.${col}`);

    // Add load_run_id from load_run_files
    const allColumns = [...stagingColumns, "lrf.load_run_id"];

    const query = `
      SELECT ${allColumns.join(", ")}
      FROM ${this.config.sourceTable} stg
      INNER JOIN etl.load_run_files lrf ON stg.load_run_file_id = lrf.load_run_file_id
      WHERE lrf.load_run_id = $1
      ORDER BY ${this.config.businessKeyFields.map((f) => `stg.${this.toSnakeCase(f)}`).join(", ")}
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

        // Insert or upsert based on configuration mode
        // Available modes:
        // - "upsert": Insert if new, update if exists (default)
        // - "insert": Only insert - fails if record exists
        // - "update": Only update - fails if record doesn't exist
        const upsertMode = options.upsertMode ?? "upsert";
        if (upsertMode === "upsert") {
          // Check if record exists to determine insert vs update
          const isUpdate = await this.recordExists(client, businessKey);
          if (isUpdate) {
            await this.updateFact(client, factRecord);
            updated++;
          } else {
            await this.insertFact(client, factRecord);
            inserted++;
          }
        } else if (upsertMode === "insert") {
          // Force insert only - will fail if record exists
          await this.insertFact(client, factRecord);
          inserted++;
        } else {
          // Force update only - will fail if record doesn't exist
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
   * Maps dimension business keys to surrogate keys and validates required relationships
   * @param stagingRecord - Raw staging data containing dimension lookup fields
   * @returns Resolved fact record with FK mappings and validation status
   */
  private async resolveForeignKeys(
    stagingRecord: Record<string, unknown>
  ): Promise<ResolvedFactRecord> {
    // Track resolved foreign keys and their surrogate key mappings
    const resolvedFKs = new Map<DimensionType, ResolvedForeignKey>();
    // Track which required dimensions are missing for later skip decision
    const missingRequiredFKs: DimensionType[] = [];
    let skipReason: string | undefined;

    // Algorithm: For each FK relationship defined in config
    // 1. Extract dimension business key from staging record
    // 2. Use FK resolver to lookup surrogate key in dimension table
    // 3. Handle missing FKs based on configured strategy (error vs skip)
    // 4. Collect results for final decision on record insertion

    for (const fkRelationship of this.config.foreignKeyRelationships) {
      // Extract business key for dimension lookup from staging record
      const dimBusinessKey: Record<string, unknown> = {};
      for (const field of fkRelationship.lookupFields) {
        dimBusinessKey[field] = stagingRecord[field];
      }

      // Resolve FK using the FK resolver service to get surrogate key
      const resolved = await this.fkResolver.resolveForeignKey(
        fkRelationship.dimensionType,
        dimBusinessKey
      );

      resolvedFKs.set(fkRelationship.dimensionType, resolved);

      // Handle missing FK based on relationship configuration strategy
      if (!resolved.found) {
        if (fkRelationship.required) {
          if (fkRelationship.missingStrategy === "error") {
            // Fail fast if required dimension is missing and strategy is error
            throw new Error(
              `Required dimension ${fkRelationship.dimensionType} not found: ${JSON.stringify(dimBusinessKey)}`
            );
          } else if (fkRelationship.missingStrategy === "skip") {
            // Track missing required FKs for later decision making
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
   * Constructs the final fact table record from resolved FKs and staging data
   * @param resolved - FK resolution results containing surrogate key mappings
   * @param stagingRecord - Raw staging data containing fact attributes
   * @returns Complete fact record ready for database insertion
   */
  private buildFactRecord(
    resolved: ResolvedFactRecord,
    stagingRecord: Record<string, unknown>
  ): Record<string, unknown> {
    const factRecord: Record<string, unknown> = {};

    // Add business keys - these uniquely identify the fact record
    for (const field of this.config.businessKeyFields) {
      factRecord[this.toSnakeCase(field)] = stagingRecord[field];
    }

    // Add foreign keys - map dimension surrogate keys to fact table columns
    for (const [dimType, resolvedFK] of resolved.resolvedFKs.entries()) {
      const fkRelationship = this.config.foreignKeyRelationships.find(
        (r) => r.dimensionType === dimType
      );
      if (fkRelationship) {
        factRecord[fkRelationship.factColumn] = resolvedFK.surrogateKey;
      }
    }

    // Add attributes from field mappings - transform staging data to fact table format
    for (const mapping of this.config.fieldMappings) {
      const value = stagingRecord[mapping.sourceField];
      // Apply transformation function if provided, otherwise use raw value
      const transformedValue = mapping.transform
        ? mapping.transform(value)
        : value;
      // Use transformed value, default value, or null if all are undefined
      factRecord[this.toSnakeCase(mapping.targetField)] =
        transformedValue ?? mapping.defaultValue ?? null;
    }

    // Add lineage fields for audit trail - track data provenance
    factRecord.load_run_id = stagingRecord.load_run_id;
    factRecord.load_ts = new Date();

    return factRecord;
  }

  /**
   * Insert fact record
   * Performs database insertion of a new fact record
   * @param client - Database client for transaction management
   * @param factRecord - Complete fact record with all fields populated
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
   * Updates existing fact record based on business key matching
   * @param client - Database client for transaction management
   * @param factRecord - Fact record containing updated values and business keys
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
   * Determines if a fact record exists based on business key lookup
   * @param client - Database client for query execution
   * @param businessKey - Business key fields to search for
   * @returns True if record exists, false otherwise
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

    // Lineage field
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
