/**
 * Staging Table Loader
 * Loads transformed and validated data into staging tables
 * Uses shared BatchLoader with staging-specific logic (upsert, lineage embedding)
 */

import type { DatabasePool } from "../shared/database-pool";
import { BatchLoader } from "../shared/batch-loader";
import type { InsertBatch, BatchResult } from "../shared/types";
import type { ErrorHandler } from "../raw-loader/error-handler";
import type { StagingTransformOptions } from "./types/transformer";

/**
 * Options for staging table loading
 */
export interface StagingLoadOptions extends StagingTransformOptions {
  batchSize: number;
  continueOnError: boolean;
}

/**
 * Staging table loader - handles inserting transformed data into staging tables
 */
export class StagingTableLoader {
  private batchLoader: BatchLoader;

  constructor(
    private dbPool: DatabasePool,
    private errorHandler: ErrorHandler
  ) {
    this.batchLoader = new BatchLoader(dbPool, errorHandler);
  }

  /**
   * Load a batch of transformed rows into staging table
   */
  async loadBatch(
    rows: Record<string, any>[],
    columns: string[],
    options: StagingLoadOptions,
    batchNumber: number
  ): Promise<BatchResult> {
    if (rows.length === 0) {
      return {
        batchNumber,
        rowsInserted: 0,
        errors: [],
        warnings: [],
        durationMs: 0,
        success: true,
      };
    }

    // Convert rows to values array
    const values = rows.map((row) => columns.map((col) => row[col] ?? null));

    // Build insert batch
    const batch: InsertBatch = {
      tableName: options.targetTable,
      columns,
      values,
      rowCount: rows.length,
      batchNumber,
      loadRunId: options.loadRunId,
    };

    // Use upsert if configured
    if (options.upsertMode && options.conflictColumns) {
      return await this.loadBatchWithUpsert(
        batch,
        options.conflictColumns,
        columns,
        options
      );
    }

    // Regular insert
    return await this.batchLoader.executeBatch(batch, {
      continueOnError: options.continueOnError,
    });
  }

  /**
   * Load batch with upsert (ON CONFLICT DO UPDATE)
   */
  private async loadBatchWithUpsert(
    batch: InsertBatch,
    conflictColumns: string[],
    updateColumns: string[],
    options: StagingLoadOptions
  ): Promise<BatchResult> {
    const startTime = Date.now();

    try {
      // Build upsert query
      const { query, paramCount } = this.batchLoader.buildUpsertQuery(
        batch.tableName,
        batch.columns,
        conflictColumns,
        updateColumns,
        batch.values.length
      );

      // Execute upsert in transaction
      const result = await this.dbPool.transaction(async (client) => {
        const flatValues = batch.values.flat();

        if (flatValues.length !== paramCount) {
          throw new Error(
            `Parameter count mismatch: expected ${paramCount}, got ${flatValues.length}`
          );
        }

        return await client.query(query, flatValues);
      });

      console.log(
        `✅ Upsert completed: ${result.rowCount} rows affected (batch ${batch.batchNumber})`
      );

      return {
        batchNumber: batch.batchNumber,
        rowsInserted: result.rowCount || 0,
        errors: [],
        warnings: [],
        durationMs: Date.now() - startTime,
        success: true,
      };
    } catch (error) {
      console.error("❌ Upsert failed:", error);

      const loadError = await this.errorHandler.handleError(error, {
        operation: "loadBatchWithUpsert",
        batch,
        options,
      });

      return {
        batchNumber: batch.batchNumber,
        rowsInserted: 0,
        errors: [loadError],
        warnings: [],
        durationMs: Date.now() - startTime,
        success: false,
      };
    }
  }

  /**
   * Embed lineage FK in transformed rows
   * Staging tables use load_run_file_id FK (same as raw tables)
   */
  embedLineage(
    transformedRow: Record<string, any>,
    rawRow: Record<string, any>
  ): Record<string, any> {
    return {
      ...transformedRow,
      // Lineage FK from raw layer (reference to etl.load_run_files)
      load_run_file_id: rawRow.load_run_file_id,
      load_ts: new Date(),
    };
  }

  /**
   * Get columns for staging table insert
   * Includes both business columns and lineage FK
   */
  getStagingColumns(transformedColumns: string[]): string[] {
    const lineageColumns = ["load_run_file_id", "load_ts"];

    return [...transformedColumns, ...lineageColumns];
  }

  /**
   * Calculate optimal batch size for staging load
   */
  calculateOptimalBatchSize(columnCount: number): number {
    return this.batchLoader.calculateOptimalBatchSize(columnCount, 1000);
  }

  /**
   * Close database connections
   */
  async close(): Promise<void> {
    await this.dbPool.close();
  }
}
