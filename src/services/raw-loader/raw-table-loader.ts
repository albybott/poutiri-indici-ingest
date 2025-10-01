import { Pool, type QueryResult } from "pg";
import { Readable } from "node:stream";
import type {
  InsertBatch,
  BatchResult,
  RawTableRow,
  LineageData,
  LoadError,
  LoadErrorType,
  RawLoadOptions,
  LoadResult,
} from "./types/raw-loader";
import type { DatabaseConfig } from "./types/config";
import { INDICI_CSV_SEPARATORS } from "./types/config";
import type { CSVRow } from "./csv-parser";
import { CSVParser } from "./csv-parser";
import type { ErrorHandler } from "./error-handler";
import { ConsoleLogWriter } from "drizzle-orm";
import { StreamBatchProcessor } from "./stream-batch-processor";

type CSVRowValue = string | number | boolean | Date;

/**
 * Database connection pool wrapper
 */
class DatabasePool {
  private pool: Pool;
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = config;
    console.log("📡 Creating database pool with config:", {
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      database: process.env.DB_NAME || "poutiri_indici",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD ?? "(not set)",
      maxConnections: config.maxConnections || 20,
      timeoutMs: config.timeoutMs || 30000,
    });

    this.pool = new Pool({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      database: process.env.DB_NAME || "poutiri_indici",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "",
      max: config.maxConnections || 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: config.timeoutMs || 30000,
    });

    this.pool.on("error", (err) => {
      console.error("Unexpected error on idle client", err);
    });
  }

  async query(text: string, params?: any[]): Promise<QueryResult> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } catch (error) {
      throw error;
    } finally {
      client.release();
    }
  }

  async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await callback(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  getConfig(): DatabaseConfig {
    return this.config;
  }
}

/**
 * Raw Table Loader - Handles database operations for loading CSV data
 */
export class RawTableLoader {
  private dbPool: DatabasePool;
  private errorHandler: ErrorHandler;

  constructor(databaseConfig: DatabaseConfig, errorHandler: ErrorHandler) {
    this.dbPool = new DatabasePool(databaseConfig);
    this.errorHandler = errorHandler;
  }

  /**
   * Calculate optimal batch size based on column count to avoid PostgreSQL parameter limits
   * If the requested batch is too large, reduce it to the optimal batch size
   */
  private validateBatchSize(
    columnCount: number,
    requestedBatchSize = 10
  ): number {
    const maxParams = 60000; // PostgreSQL limit is 65,535, leave buffer
    const maxRowsForColumns = Math.floor(maxParams / columnCount);
    const optimalBatchSize = Math.min(requestedBatchSize, maxRowsForColumns);

    if (requestedBatchSize < optimalBatchSize) {
      return requestedBatchSize;
    }

    console.log(
      `📦 Using optimal batch size: ${optimalBatchSize} for ${columnCount} columns`
    );
    return optimalBatchSize;
  }

  private prepareBatch(
    values: CSVRowValue[][],
    loadRunFileId: number,
    options: RawLoadOptions & {
      extractType: string;
      tableName: string;
      columns: string[];
    },
    batchNumber: number
  ): InsertBatch {
    const tableName = options.tableName || `raw.${options.extractType}`;

    if (values.length === 0) {
      throw new Error("Cannot prepare batch: no rows provided");
    }

    if (!options.loadRunFileId) {
      throw new Error("loadRunFileId is required for raw table loading");
    }

    const processedValues: any[][] = [];

    for (const row of values) {
      // Map values for all columns (load_run_file_id first, then business columns)
      const rowValues = [
        loadRunFileId,
        ...row.map((col: CSVRowValue) => col ?? ""),
      ];

      // Add all rows to preserve raw data integrity
      processedValues.push(rowValues);
    }

    return {
      tableName,
      columns: ["load_run_file_id", ...options.columns],
      values: processedValues,
      rowCount: processedValues.length,
      batchNumber,
      fileKey: options.loadRunFileId.toString(), // Use loadRunFileId as fileKey for compatibility
      loadRunId: options.loadRunId,
    };
  }

  async loadFromStream(
    stream: Readable,
    options: RawLoadOptions & {
      extractType: string;
      tableName: string;
      columns: string[];
    }
  ): Promise<LoadResult> {
    const loadRunFileId = options.loadRunFileId;
    if (!loadRunFileId) {
      throw new Error("loadRunFileId is required for raw table loading");
    }

    const batchSize = this.validateBatchSize(
      options.columns.length,
      options.batchSize
    );

    const csvParser = new CSVParser({
      fieldSeparator:
        options.fieldSeparator ?? INDICI_CSV_SEPARATORS.FIELD_SEPARATOR,
      rowSeparator: options.rowSeparator ?? INDICI_CSV_SEPARATORS.ROW_SEPARATOR,
      hasHeaders: false,
      skipEmptyRows: true,
    });

    const processor = new StreamBatchProcessor();

    // Define the batch executor that handles database insertion
    const batchExecutor = async (
      rows: CSVRowValue[][],
      batchNumber: number
    ) => {
      const batch = this.prepareBatch(
        rows,
        loadRunFileId,
        options,
        batchNumber
      );
      return await this.executeBatch(batch, options);
    };

    // Delegate stream processing to the specialized service
    return await processor.processStream(stream, csvParser, batchExecutor, {
      batchSize,
      maxQueueSize: 5,
      progressLogInterval: 500,
    });
  }

  /**
   * Execute a single batch insert
   */
  async executeBatch(batch: InsertBatch, options: any): Promise<BatchResult> {
    const startTime = Date.now();

    console.log(
      `📦 Executing batch values: ${batch.values.length} columns: ${batch.columns.length}`
    );

    // Validate batch data first
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
    const validRows = batch.values.filter((row) => Array.isArray(row));

    // Check if there are any valid rows
    if (validRows.length === 0) {
      throw new Error(
        `No valid rows found in batch. Original rows: ${batch.values.length}`
      );
    }

    try {
      // Use transaction for batch insert
      const result = await this.dbPool.transaction(async (client) => {
        const placeholders = validRows
          .map((_, index) => {
            const paramIndex = index * batch.columns.length + 1;
            return `(${batch.columns
              .map((_, colIndex) => `$${paramIndex + colIndex}`)
              .join(", ")})`;
          })
          .join(", ");

        console.log(`📦 Placeholders count: ${placeholders.length}`);

        const query = `
          INSERT INTO ${batch.tableName} (${batch.columns.join(", ")})
          VALUES ${placeholders}
        `;

        const flatValues = validRows.flat();

        // Final safety check
        if (flatValues.length === 0) {
          throw new Error(`No values to insert after flattening`);
        }

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
   * Close database connections
   */
  async close(): Promise<void> {
    await this.dbPool.close();
  }
}
