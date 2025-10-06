/**
 * Staging Transformer Service
 * Orchestrates the transformation of data from raw tables to staging tables
 * - Reads from raw.* tables (SQL source)
 * - Transforms text → typed columns
 * - Validates data quality
 * - Handles rejections
 * - Loads to stg.* tables
 */

import type { DatabasePool } from "@/services/shared/database-pool";
import type { ErrorHandler } from "@/services/raw-loader/error-handler";
import { RawQueryBuilder, type RawQueryOptions } from "./raw-query-builder";
import { TransformationEngine } from "./transformation-engine";
import { ValidationEngine } from "./validation-engine";
import { RejectionHandler } from "./rejection-handler";
import { StagingTableLoader } from "./staging-table-loader";
import { StagingRunService } from "./staging-run-service";
import type {
  StagingTransformOptions,
  TransformResult,
  StagingExtractHandler,
  RejectedRow,
} from "./types/transformer";
import type { StagingTransformerConfig } from "./types/config";
import type { LoadError, LoadWarning } from "@/services/shared/types";

/**
 * Main staging transformer service
 */
export class StagingTransformerService {
  private queryBuilder: RawQueryBuilder;
  private transformationEngine: TransformationEngine;
  private validationEngine: ValidationEngine;
  private rejectionHandler: RejectionHandler;
  private stagingLoader: StagingTableLoader;
  private stagingRunService: StagingRunService;

  constructor(
    private dbPool: DatabasePool,
    private errorHandler: ErrorHandler,
    private config: StagingTransformerConfig
  ) {
    this.queryBuilder = new RawQueryBuilder();
    this.transformationEngine = new TransformationEngine(config.transformation);
    this.validationEngine = new ValidationEngine(config.validation);
    this.rejectionHandler = new RejectionHandler(dbPool, config.validation);
    this.stagingLoader = new StagingTableLoader(dbPool, errorHandler);
    this.stagingRunService = new StagingRunService();
  }

  /**
   * Transform data from raw table to staging table
   */
  async transformExtract(
    handler: StagingExtractHandler,
    options: Partial<StagingTransformOptions> = {}
  ): Promise<TransformResult> {
    const startTime = Date.now();
    const transformOptions = this.buildTransformOptions(handler, options);

    console.log(
      `🔄 Starting transformation: ${handler.extractType} (${handler.sourceTable} → ${handler.targetTable})`
    );

    // Check idempotency (unless forced)
    if (!options.loadRunId) {
      throw new Error(
        "loadRunId is required for staging transformation tracking"
      );
    }

    if (!options.forceReprocess) {
      const existing = await this.stagingRunService.getExistingStagingRun(
        options.loadRunId,
        handler.extractType
      );
      if (existing && existing.status === "completed") {
        console.log(
          `Staging transformation already completed - returning cached result`,
          {
            loadRunId: options.loadRunId,
            stagingRunId: existing.stagingRunId,
          }
        );
        return existing.result
          ? JSON.parse(existing.result)
          : this.emptyResult(existing.stagingRunId);
      }
    }

    // Create staging run record
    const stagingRunId = await this.stagingRunService.createRun({
      loadRunId: options.loadRunId,
      extractType: handler.extractType,
      sourceTable: handler.sourceTable,
      targetTable: handler.targetTable,
    });

    console.log(`📝 Created staging run: ${stagingRunId}`);

    try {
      // Ensure rejection table exists
      await this.rejectionHandler.ensureRejectionTableExists(
        "etl.staging_rejections"
      );

      // Count total rows to transform
      const countQuery = this.queryBuilder.buildCountQuery({
        sourceTable: handler.sourceTable,
      });
      const countResult = await this.dbPool.query(
        countQuery.query,
        countQuery.params
      );
      const totalRows = parseInt(countResult.rows[0]?.total || "0", 10);

      console.log(`📊 Total rows to transform: ${totalRows}`);

      if (totalRows === 0) {
        const emptyResult = this.emptyResult(stagingRunId);
        await this.stagingRunService.completeRun(stagingRunId, emptyResult);
        return emptyResult;
      }

      // Transform in batches
      const result = await this.transformInBatches(
        handler,
        transformOptions,
        totalRows,
        stagingRunId
      );

      // Calculate final metrics
      const finalResult = {
        ...result,
        durationMs: Date.now() - startTime,
        rowsPerSecond: Math.round(
          result.totalRowsRead > 0
            ? result.totalRowsRead / ((Date.now() - startTime) / 1000)
            : 0
        ),
        memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      };

      console.log(
        `✅ Transformation complete: ${result.totalRowsTransformed}/${totalRows} rows transformed, ${result.totalRowsRejected} rejected`
      );

      // Complete the staging run
      await this.stagingRunService.completeRun(stagingRunId, finalResult);

      return {
        ...finalResult,
        stagingRunId,
      };
    } catch (error) {
      console.error("❌ Transformation failed:", error);

      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Fail the staging run
      await this.stagingRunService.failRun(stagingRunId, errorMessage, {
        failedBatches: 1,
        durationMs: Date.now() - startTime,
        memoryUsageMB: process.memoryUsage().heapUsed / 1024 / 1024,
      });

      const loadError = await this.errorHandler.handleError(error, {
        operation: "transformExtract",
        handler,
        options: transformOptions,
      });

      return {
        stagingRunId,
        totalRowsRead: 0,
        totalRowsTransformed: 0,
        totalRowsRejected: 0,
        successfulBatches: 0,
        failedBatches: 1,
        errors: [loadError],
        warnings: [],
        rejections: [],
        durationMs: Date.now() - startTime,
        rowsPerSecond: 0,
        memoryUsageMB: process.memoryUsage().heapUsed / 1024 / 1024,
      };
    }
  }

  /**
   * Transform data in batches
   */
  private async transformInBatches(
    handler: StagingExtractHandler,
    options: StagingTransformOptions,
    totalRows: number,
    stagingRunId: string
  ): Promise<TransformResult> {
    const startTime = Date.now();
    const batchSize = options.batchSize || this.config.transformation.batchSize;
    const totalBatches = Math.ceil(totalRows / batchSize);

    let totalRowsRead = 0;
    let totalRowsTransformed = 0;
    let totalRowsRejected = 0;
    let totalRowsDeduplicated = 0;
    let successfulBatches = 0;
    let failedBatches = 0;
    const errors: LoadError[] = [];
    const warnings: LoadWarning[] = [];
    const rejections: RejectedRow[] = [];

    // Process each batch
    for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
      const offset = batchNum * batchSize;

      console.log(
        `📦 Processing batch ${batchNum + 1}/${totalBatches} (offset ${offset})`
      );

      try {
        // Read batch from raw table
        const queryOptions: RawQueryOptions = {
          sourceTable: handler.sourceTable,
          limit: batchSize,
          offset,
        };

        const { query, params } =
          this.queryBuilder.buildSelectQuery(queryOptions);
        const result = await this.dbPool.query(query, params);
        const rawRows = result.rows;

        totalRowsRead += rawRows.length;

        if (rawRows.length === 0) {
          continue;
        }

        // Transform and validate batch
        const batchResult = await this.transformAndLoadBatch(
          rawRows,
          handler,
          options,
          batchNum + 1
        );

        totalRowsTransformed += batchResult.transformedCount;
        totalRowsRejected += batchResult.rejectedCount;
        totalRowsDeduplicated += batchResult.deduplicationCount;
        rejections.push(...batchResult.rejections);
        errors.push(...batchResult.errors);
        warnings.push(...batchResult.warnings);

        if (batchResult.success) {
          successfulBatches++;
        } else {
          failedBatches++;

          // Log load errors that caused batch failure
          console.error(
            `❌ Batch ${batchNum + 1} failed: ${batchResult.errors.length} load errors`
          );

          if (batchResult.errors.length > 0) {
            console.error(
              `   Errors:`,
              batchResult.errors.map((e) => e.message).join(", ")
            );
          }
        }

        // Check if we should stop due to too many errors
        if (
          this.validationEngine.shouldStopValidation(
            batchResult.rejectedCount,
            totalRowsRejected
          )
        ) {
          console.warn("⚠️ Stopping transformation due to error threshold");
          break;
        }
      } catch (error) {
        console.error(`❌ Batch ${batchNum + 1} failed:`, error);
        failedBatches++;

        const loadError = await this.errorHandler.handleError(error, {
          operation: "transformBatch",
          batchNumber: batchNum + 1,
        });
        errors.push(loadError);

        if (!this.config.errorHandling.continueOnError) {
          break;
        }
      }
    }

    // Store all rejections
    if (rejections.length > 0) {
      await this.rejectionHandler.storeRejections(rejections, {
        rejectionTable: "etl.staging_rejections",
        extractType: handler.extractType,
        loadRunId: options.loadRunId,
      });
    }

    const durationMs = Date.now() - startTime;
    const rowsPerSecond = (totalRowsTransformed / durationMs) * 1000;

    return {
      stagingRunId,
      totalRowsRead,
      totalRowsTransformed,
      totalRowsRejected,
      totalRowsDeduplicated,
      successfulBatches,
      failedBatches,
      errors,
      warnings,
      rejections,
      durationMs,
      rowsPerSecond,
      memoryUsageMB: process.memoryUsage().heapUsed / 1024 / 1024,
    };
  }

  /**
   * Transform and load a single batch
   */
  private async transformAndLoadBatch(
    rawRows: Record<string, any>[],
    handler: StagingExtractHandler,
    options: StagingTransformOptions,
    batchNumber: number
  ): Promise<{
    transformedCount: number;
    rejectedCount: number;
    deduplicationCount: number;
    rejections: RejectedRow[];
    errors: LoadError[];
    warnings: LoadWarning[];
    success: boolean;
  }> {
    const transformedRows: Record<string, any>[] = [];
    const rejections: RejectedRow[] = [];
    const errors: LoadError[] = [];
    const warnings: LoadWarning[] = [];

    // Transform each row
    for (let i = 0; i < rawRows.length; i++) {
      const rawRow = rawRows[i];

      try {
        // Transform row
        const transformResult = await this.transformationEngine.transformRow(
          rawRow,
          handler.transformations
        );

        if (!transformResult.success) {
          // Transformation failed
          rejections.push({
            rowNumber: i + 1,
            rejectionReason: "Transformation failed",
            failedValidations: transformResult.validationFailures,
            rawData: rawRow,
            timestamp: new Date(),
          });
          continue;
        }

        // Validate row
        if (!options.skipValidation) {
          const validationResult = this.validationEngine.validateRow(
            transformResult.transformedRow!,
            handler.transformations
          );

          if (!validationResult.isValid) {
            // Validation failed
            rejections.push({
              rowNumber: i + 1,
              rejectionReason: "Validation failed",
              failedValidations: validationResult.failures,
              rawData: rawRow,
              timestamp: new Date(),
            });
            continue;
          }

          // Collect warnings
          if (validationResult.warnings.length > 0) {
            warnings.push({
              message: `Row ${i + 1} has validation warnings`,
              rowNumber: i + 1,
              timestamp: new Date(),
              severity: "medium",
            });
          }
        }

        // Embed lineage FK (load_run_file_id)
        const rowWithLineage = this.stagingLoader.embedLineage(
          transformResult.transformedRow!,
          rawRow
        );

        transformedRows.push(rowWithLineage);
      } catch (error) {
        console.error(`Error transforming row ${i + 1}:`, error);
        rejections.push({
          rowNumber: i + 1,
          rejectionReason:
            error instanceof Error ? error.message : String(error),
          failedValidations: [],
          rawData: rawRow,
          timestamp: new Date(),
        });
      }
    }

    // Deduplicate transformed rows by natural key to prevent upsert conflicts
    const deduplicatedRows = this.deduplicateByNaturalKey(
      transformedRows,
      options.conflictColumns || []
    );

    // Track deduplication metrics
    const deduplicationCount = transformedRows.length - deduplicatedRows.length;

    // Load transformed rows to staging table
    let loadSuccess = true;
    if (deduplicatedRows.length > 0) {
      const columns = this.stagingLoader.getStagingColumns(
        handler.transformations.map((t) => t.targetColumn)
      );

      const loadResult = await this.stagingLoader.loadBatch(
        deduplicatedRows,
        columns,
        {
          ...options,
          batchSize: this.config.transformation.batchSize,
          continueOnError: this.config.errorHandling.continueOnError,
        },
        batchNumber
      );

      loadSuccess = loadResult.success;
      errors.push(...loadResult.errors);
      warnings.push(...loadResult.warnings);
    }

    return {
      transformedCount: deduplicatedRows.length,
      rejectedCount: rejections.length,
      deduplicationCount,
      rejections,
      errors,
      warnings,
      success: loadSuccess,
    };
  }

  /**
   * Deduplicate rows by natural key to prevent upsert conflicts
   * Keeps the row with the most recent updatedAt timestamp for each unique natural key combination
   *
   * Improvements:
   * - Safe key generation using null-byte separator to prevent collisions
   * - Robust timestamp parsing that handles invalid dates
   * - Deterministic tie-breaking for identical timestamps
   * - Enhanced logging with deduplication examples
   */
  private deduplicateByNaturalKey(
    rows: Record<string, any>[],
    naturalKeyColumns: string[]
  ): Record<string, any>[] {
    if (naturalKeyColumns.length === 0) {
      return rows; // No deduplication needed if no natural key defined
    }

    const keyToRows = new Map<string, Record<string, any>[]>();

    // Group rows by natural key using null-byte separator (collision-resistant)
    for (const row of rows) {
      const key = this.generateNaturalKey(row, naturalKeyColumns);

      if (!keyToRows.has(key)) {
        keyToRows.set(key, []);
      }
      keyToRows.get(key)!.push(row);
    }

    const deduplicated: Record<string, any>[] = [];

    // Track deduplication statistics
    let totalDuplicatesRemoved = 0;
    const exampleKeys: string[] = [];

    // For each group, keep the row with the most recent updatedAt
    for (const [key, groupRows] of keyToRows) {
      if (groupRows.length === 1) {
        deduplicated.push(groupRows[0]);
      } else {
        // Find the row with the most recent updatedAt timestamp
        const latestRow = this.findLatestRowByTimestamp(groupRows);
        deduplicated.push(latestRow);

        totalDuplicatesRemoved += groupRows.length - 1;

        // Collect examples for logging (limit to first 3)
        if (exampleKeys.length < 3) {
          exampleKeys.push(
            `${key.replace(/\0/g, "|")} (${groupRows.length} rows)`
          );
        }
      }
    }

    // Log deduplication results with enhanced details
    if (totalDuplicatesRemoved > 0) {
      console.log(
        `🧹 Removed ${totalDuplicatesRemoved} duplicate rows by natural key in batch ` +
          `(${rows.length} → ${deduplicated.length} rows, kept most recent updatedAt)`
      );

      if (exampleKeys.length > 0) {
        console.log(`  Examples: ${exampleKeys.join(", ")}`);
      }
    }

    return deduplicated;
  }

  /**
   * Generate a collision-resistant natural key using null-byte separator
   */
  private generateNaturalKey(
    row: Record<string, any>,
    columns: string[]
  ): string {
    return columns
      .map((col) => {
        const val = row[col];
        // Use null byte marker for null/undefined, strip null bytes from values
        return val === null || val === undefined
          ? "\0NULL\0"
          : String(val).replace(/\0/g, "");
      })
      .join("\0"); // Null byte separator
  }

  /**
   * Safely parse timestamp, handling invalid dates
   */
  private parseTimestamp(val: any): number {
    if (!val) return 0; // Epoch for missing dates
    const date = new Date(val);
    return isNaN(date.getTime()) ? 0 : date.getTime();
  }

  /**
   * Find the row with the most recent timestamp, with deterministic tie-breaking
   */
  private findLatestRowByTimestamp(
    groupRows: Record<string, any>[]
  ): Record<string, any> {
    // Create array of [row, timestamp, index] tuples for deterministic processing
    const rowsWithMetadata = groupRows.map((row, index) => ({
      row,
      timestamp: this.parseTimestamp(row.updatedAt),
      originalIndex: index, // Use original index as tiebreaker
    }));

    // Find row with max timestamp (deterministic tie-breaking)
    return rowsWithMetadata.reduce((latest, current) => {
      if (current.timestamp > latest.timestamp) return current;
      if (current.timestamp === latest.timestamp) {
        // Deterministic tiebreaker: prefer lower original index (first seen)
        return current.originalIndex < latest.originalIndex ? current : latest;
      }
      return latest;
    }).row;
  }

  /**
   * Build transform options with defaults
   */
  private buildTransformOptions(
    handler: StagingExtractHandler,
    options: Partial<StagingTransformOptions>
  ): StagingTransformOptions {
    return {
      extractType: handler.extractType,
      loadRunId: options.loadRunId || crypto.randomUUID(),
      sourceTable: handler.sourceTable,
      targetTable: handler.targetTable,
      batchSize: options.batchSize || this.config.transformation.batchSize,
      skipValidation: options.skipValidation ?? false,
      upsertMode: options.upsertMode ?? true,
      conflictColumns: options.conflictColumns || handler.naturalKeys,
    };
  }

  /**
   * Return empty result
   */
  private emptyResult(stagingRunId: string): TransformResult {
    return {
      stagingRunId,
      totalRowsRead: 0,
      totalRowsTransformed: 0,
      totalRowsRejected: 0,
      successfulBatches: 0,
      failedBatches: 0,
      errors: [],
      warnings: [],
      rejections: [],
      durationMs: 0,
      rowsPerSecond: 0,
      memoryUsageMB: 0,
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.dbPool.query("SELECT 1");
      return true;
    } catch (error) {
      console.error("Health check failed:", error);
      return false;
    }
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    await this.stagingLoader.close();
  }
}
