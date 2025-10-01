import type { DatabasePool } from "./database-pool";
import type { ErrorHandler } from "../raw-loader/error-handler";
import type { InsertBatch, BatchResult } from "./types";

/**
 * Generic batch loader for database operations
 * Handles batch insertion with transaction support and error handling
 * Can be used across all ETL layers (raw, staging, core)
 */
export class BatchLoader {
  constructor(
    private dbPool: DatabasePool,
    private errorHandler: ErrorHandler
  ) {}

  /**
   * Calculate optimal batch size based on column count to avoid PostgreSQL parameter limits
   * PostgreSQL has a limit of 65,535 parameters per query
   */
  calculateOptimalBatchSize(
    columnCount: number,
    requestedBatchSize = 10
  ): number {
    const maxParams = 60000; // Leave buffer below PostgreSQL limit
    const maxRowsForColumns = Math.floor(maxParams / columnCount);
    const optimalBatchSize = Math.min(requestedBatchSize, maxRowsForColumns);

    if (requestedBatchSize > optimalBatchSize) {
      console.log(
        `📦 Adjusted batch size from ${requestedBatchSize} to ${optimalBatchSize} for ${columnCount} columns`
      );
    }

    return optimalBatchSize;
  }

  /**
   * Execute a batch insert operation with transaction support
   * Returns the result of the batch operation
   */
  async executeBatch(
    batch: InsertBatch,
    options?: { continueOnError?: boolean }
  ): Promise<BatchResult> {
    const startTime = Date.now();

    console.log(
      `📦 Executing batch ${batch.batchNumber}: ${batch.values.length} rows, ${batch.columns.length} columns`
    );

    // Validate batch data
    if (!batch.values || batch.values.length === 0) {
      throw new Error(`Batch has no values to insert`);
    }

    if (!batch.columns || batch.columns.length === 0) {
      throw new Error(`Batch has no columns defined`);
    }

    const notAllArrays = batch.values.some((row) => !Array.isArray(row));
    if (notAllArrays) {
      throw new Error(`Batch values are not all arrays`);
    }

    // Filter out any empty or invalid rows
    const validRows = batch.values.filter(
      (row) => Array.isArray(row) && row.length > 0
    );

    if (validRows.length === 0) {
      throw new Error(
        `No valid rows found in batch. Original rows: ${batch.values.length}`
      );
    }

    try {
      // Use transaction for batch insert
      const result = await this.dbPool.transaction(async (client) => {
        // Build parameterized query
        const placeholders = validRows
          .map((_, rowIndex) => {
            const paramIndex = rowIndex * batch.columns.length + 1;
            return `(${batch.columns
              .map((_, colIndex) => `$${paramIndex + colIndex}`)
              .join(", ")})`;
          })
          .join(", ");

        const query = `
          INSERT INTO ${batch.tableName} (${batch.columns.join(", ")})
          VALUES ${placeholders}
        `;

        const flatValues = validRows.flat();

        // Verify parameter count matches
        const expectedParamCount = validRows.length * batch.columns.length;
        if (flatValues.length !== expectedParamCount) {
          throw new Error(
            `Parameter count mismatch: expected ${expectedParamCount}, got ${flatValues.length}`
          );
        }

        return await client.query(query, flatValues);
      });

      return {
        batchNumber: batch.batchNumber,
        rowsInserted: result.rowCount || 0,
        errors: [],
        warnings: [],
        durationMs: Date.now() - startTime,
        success: true,
      };
    } catch (error) {
      console.error("❌ Database error in executeBatch:", error);
      console.error("🔍 Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack:
          error instanceof Error
            ? error.stack?.split("\n").slice(0, 3)
            : undefined,
        batch: {
          tableName: batch.tableName,
          columns: batch.columns,
          rowCount: batch.rowCount,
        },
      });

      const loadError = await this.errorHandler.handleError(error, {
        operation: "executeBatch",
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
   * Execute multiple batches in sequence
   */
  async executeBatches(
    batches: InsertBatch[],
    options?: { continueOnError?: boolean }
  ): Promise<BatchResult[]> {
    const results: BatchResult[] = [];

    for (const batch of batches) {
      const result = await this.executeBatch(batch, options);
      results.push(result);

      // Stop on first error if continueOnError is false
      if (!result.success && !options?.continueOnError) {
        break;
      }
    }

    return results;
  }

  /**
   * Build an INSERT query for upsert operations (ON CONFLICT)
   * Useful for staging and core layers with unique constraints
   */
  buildUpsertQuery(
    tableName: string,
    columns: string[],
    conflictColumns: string[],
    updateColumns: string[],
    rowCount: number
  ): { query: string; paramCount: number } {
    const placeholders: string[] = [];
    let paramIndex = 1;

    for (let i = 0; i < rowCount; i++) {
      const rowPlaceholders = columns.map(() => `$${paramIndex++}`).join(", ");
      placeholders.push(`(${rowPlaceholders})`);
    }

    const updateClause = updateColumns
      .map((col) => `${col} = EXCLUDED.${col}`)
      .join(", ");

    const query = `
      INSERT INTO ${tableName} (${columns.join(", ")})
      VALUES ${placeholders.join(", ")}
      ON CONFLICT (${conflictColumns.join(", ")})
      DO UPDATE SET ${updateClause}
    `;

    return { query, paramCount: paramIndex - 1 };
  }
}
