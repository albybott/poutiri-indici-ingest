/**
 * Dimension Loader
 * Orchestrates loading of dimensions with SCD2 logic
 */

import type { Pool } from "pg";
import { SCD2Engine } from "./scd2-engine";
import { BaseDimensionHandler } from "./handlers/base-dimension-handler";
import type {
  DimensionLoadOptions,
  DimensionLoadResult,
  DimensionError,
} from "../types/dimension";
import type {
  DimensionType,
  LineageMetadata,
  DimensionRecord,
} from "../types/scd2";
import { ChangeType as CT } from "../types/scd2";
import { logger } from "../../../shared/utils/logger";

export class DimensionLoader {
  private pool: Pool;
  private handler: BaseDimensionHandler;
  private scd2Engine: SCD2Engine;

  constructor(
    pool: Pool,
    handler: BaseDimensionHandler,
    useHashStrategy: boolean = true
  ) {
    this.pool = pool;
    this.handler = handler;
    this.scd2Engine = new SCD2Engine(handler.getSCD2Config());
  }

  /**
   * Load dimension from staging
   */
  async loadDimension(
    options: DimensionLoadOptions
  ): Promise<DimensionLoadResult> {
    const startTime = Date.now();
    const dimensionType = this.handler.getDimensionType();

    logger.info(`Starting ${dimensionType} dimension load`, {
      loadRunId: options.loadRunId,
      extractType: options.extractType,
    });

    const result: DimensionLoadResult = {
      dimensionType,
      extractType: options.extractType,
      totalRowsRead: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsExpired: 0,
      recordsSkipped: 0,
      successfulBatches: 0,
      failedBatches: 0,
      durationMs: 0,
      rowsPerSecond: 0,
      memoryUsageMB: 0,
      errors: [],
      warnings: [],
    };

    const client = await this.pool.connect();

    try {
      // Start transaction (for safety)
      await client.query("BEGIN");

      // Read staging data
      const stagingRecords = await this.readStagingData(
        client,
        options.loadRunId
      );

      result.totalRowsRead = stagingRecords.length;

      if (stagingRecords.length === 0) {
        logger.warn(`No staging records found for ${dimensionType}`, {
          loadRunId: options.loadRunId,
        });
        await client.query("COMMIT");
        return result;
      }

      // Process records in batches for better memory management and performance
      // Default batch size balances memory usage with transaction efficiency
      const batchSize = options.batchSize ?? 500;
      const batches = this.createBatches(stagingRecords, batchSize);

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const batchNum = i + 1;

        logger.info(
          `Processing batch ${batchNum}/${batches.length} (${batch.length} records)`
        );

        try {
          const batchResult = await this.processBatch(client, batch, options);

          logger.info(`Batch ${batchNum} completed`, {
            created: batchResult.created,
            updated: batchResult.updated,
            skipped: batchResult.skipped,
          });

          result.recordsCreated += batchResult.created;
          result.recordsUpdated += batchResult.updated;
          result.recordsExpired += batchResult.expired;
          result.recordsSkipped += batchResult.skipped;
          result.errors.push(...batchResult.errors);
          result.warnings.push(...batchResult.warnings);

          result.successfulBatches++;
        } catch (error) {
          logger.error(`Batch ${batchNum} failed`, {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          });
          result.failedBatches++;
          const errorMsg =
            error instanceof Error ? error.message : String(error);

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
        logger.info(`Committed ${dimensionType} dimension changes`);
      } else {
        await client.query("ROLLBACK");
        logger.info(`Dry run - rolled back ${dimensionType} changes`);
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
    result.rowsPerSecond = Math.round(
      result.durationMs > 0
        ? (result.totalRowsRead / result.durationMs) * 1000
        : 0
    );
    result.memoryUsageMB = Math.round(
      process.memoryUsage().heapUsed / 1024 / 1024
    );

    logger.info(`Completed ${dimensionType} dimension load`, {
      totalRows: result.totalRowsRead,
      created: result.recordsCreated,
      updated: result.recordsUpdated,
      expired: result.recordsExpired,
      skipped: result.recordsSkipped,
      errors: result.errors.length,
      durationMs: result.durationMs,
    });

    return result;
  }

  /**
   * Read staging data
   */
  private async readStagingData(
    client: any,
    loadRunId: string
  ): Promise<Record<string, unknown>[]> {
    const query = this.handler.buildSelectQuery(loadRunId);
    const result = await client.query(query, [loadRunId]);
    return result.rows;
  }

  /**
   * Process a batch of staging records
   */
  private async processBatch(
    client: any,
    batch: Record<string, unknown>[],
    options: DimensionLoadOptions
  ): Promise<{
    created: number;
    updated: number;
    expired: number;
    skipped: number;
    errors: DimensionError[];
    warnings: string[];
  }> {
    let created = 0;
    let updated = 0;
    let expired = 0;
    let skipped = 0;
    const errors: DimensionError[] = [];
    const warnings: string[] = [];

    for (let i = 0; i < batch.length; i++) {
      const stagingRecord = batch[i];
      const recordNum = i + 1;

      try {
        // Validate staging record
        const validation =
          await this.handler.validateStagingRecord(stagingRecord);

        if (!validation.valid) {
          const errorMsg = `Validation failed: ${validation.errors.join(", ")}`;
          // Log first few errors for debugging
          if (errors.length < 3) {
            logger.error(`Dimension validation error`, {
              error: errorMsg,
              sampleRecord: Object.keys(stagingRecord).slice(0, 10),
            });
          }
          errors.push({
            errorType: "business_key_missing",
            message: errorMsg,
          });
          skipped++;
          continue;
        }

        // Transform to dimension record
        const lineage: LineageMetadata = {
          loadRunId: options.loadRunId,
          loadTs: new Date(),
        };

        const newDimensionRecord =
          await this.handler.transformStagingToDimension(
            stagingRecord,
            lineage
          );

        // Get current version from database
        const currentVersion = await this.getCurrentVersion(
          client,
          newDimensionRecord.businessKey
        );

        // Detect changes using SCD2 engine
        const change = await this.scd2Engine.detectChangesWithHash(
          currentVersion,
          newDimensionRecord
        );

        // Apply changes based on change type
        if (change.changeType === CT.NEW) {
          await this.insertNewVersion(client, change.newVersion);
          created++;
        } else if (change.changeType === CT.UPDATED) {
          // Expire old version and insert new version
          if (currentVersion) {
            await this.expireVersion(client, currentVersion);
            expired++;
          }
          await this.insertNewVersion(client, change.newVersion);
          updated++;
        } else if (change.changeType === CT.NO_CHANGE) {
          // Update non-significant fields in place (if any changes)
          if (change.attributeChanges.length > 0) {
            await this.updateInPlace(client, change.newVersion);
            warnings.push(
              `Updated non-significant fields for business key: ${JSON.stringify(change.businessKey)}`
            );
          }
          skipped++;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        // Log first few errors for debugging
        if (errors.length < 3) {
          logger.error(`Dimension transformation error`, {
            error: errorMsg,
            stack: error instanceof Error ? error.stack : undefined,
          });
        }
        errors.push({
          errorType: "transformation_error",
          message: errorMsg,
          stack: error instanceof Error ? error.stack : undefined,
        });
        skipped++;
      }
    }

    return { created, updated, expired, skipped, errors, warnings };
  }

  /**
   * Get current version of dimension by business key
   */
  private async getCurrentVersion(
    client: any,
    businessKey: Record<string, unknown>
  ): Promise<DimensionRecord | null> {
    const query = this.handler.buildGetCurrentQuery();
    const businessKeyFields = this.handler.getBusinessKeyFields();
    const params = businessKeyFields.map((field) => businessKey[field]);

    const result = await client.query(query, params);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    // Convert database row to DimensionRecord
    return this.rowToDimensionRecord(row);
  }

  /**
   * Insert new dimension version
   */
  private async insertNewVersion(
    client: any,
    record: DimensionRecord
  ): Promise<void> {
    const query = this.handler.buildInsertQuery();
    const params = this.buildInsertParams(record);
    await client.query(query, params);
  }

  /**
   * Update non-significant fields in place
   */
  private async updateInPlace(
    client: any,
    record: DimensionRecord
  ): Promise<void> {
    const query = this.handler.buildUpdateQuery();
    const params = this.buildUpdateParams(record);

    await client.query(query, params);
  }

  /**
   * Expire a dimension version (set effective_to, is_current = false)
   */
  private async expireVersion(
    client: any,
    record: DimensionRecord
  ): Promise<void> {
    const query = this.handler.buildExpireQuery();
    const businessKeyFields = this.handler.getBusinessKeyFields();
    const params = businessKeyFields
      .map((field) => record.businessKey[field])
      .concat([new Date()]); // effective_to

    await client.query(query, params);
  }

  /**
   * Build parameters for INSERT query
   */
  private buildInsertParams(record: DimensionRecord): unknown[] {
    const params: unknown[] = [];
    const config = this.handler.getConfig();

    // console.log("Building insert params for record:", record);

    // Business keys
    for (const field of config.businessKeyFields) {
      params.push(record.businessKey[field]);
    }

    // Attributes
    for (const mapping of config.fieldMappings) {
      params.push(record.attributes[mapping.targetField] ?? null);
    }

    // SCD2 fields
    params.push(record.effectiveFrom, record.effectiveTo, record.isCurrent);

    // Lineage
    params.push(record.lineage.loadRunId, record.lineage.loadTs);

    return params;
  }

  /**
   * Build parameters for UPDATE query
   */
  private buildUpdateParams(record: DimensionRecord): unknown[] {
    const params: unknown[] = [];
    const config = this.handler.getConfig();

    // Non-significant fields
    for (const field of config.nonSignificantFields) {
      params.push(record.attributes[field] ?? null);
    }

    // Lineage
    params.push(record.lineage.loadRunId, record.lineage.loadTs);

    // Business key for WHERE clause
    for (const field of config.businessKeyFields) {
      params.push(record.businessKey[field]);
    }

    return params;
  }

  /**
   * Convert database row to DimensionRecord
   */
  private rowToDimensionRecord(row: any): DimensionRecord {
    const config = this.handler.getConfig();

    // Extract business key
    const businessKey: Record<string, unknown> = {};
    for (const field of config.businessKeyFields) {
      const snakeField = this.toSnakeCase(field);
      businessKey[field] = row[snakeField];
    }

    // Extract attributes
    const attributes: Record<string, unknown> = {};
    for (const mapping of config.fieldMappings) {
      const snakeField = this.toSnakeCase(mapping.targetField);
      attributes[mapping.targetField] = row[snakeField];
    }

    // Extract lineage
    const lineage: LineageMetadata = {
      loadRunId: row.load_run_id,
      loadTs: row.load_ts,
    };

    return {
      surrogateKey: row[`${this.handler.getDimensionType()}_key`],
      businessKey,
      practiceId: row.practice_id,
      perOrgId: row.per_org_id,
      effectiveFrom: row.effective_from,
      effectiveTo: row.effective_to,
      isCurrent: row.is_current,
      attributes,
      lineage,
    };
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
   * Get dimension type
   */
  getDimensionType(): DimensionType {
    return this.handler.getDimensionType();
  }
}
