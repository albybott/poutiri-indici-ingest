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
import type { CSVRow } from "./indici-csv-parser";
import { IndiciCSVParser } from "./indici-csv-parser";
import type { LineageService } from "./lineage-service";
import type { ErrorHandler } from "./error-handler";
import { ConsoleLogWriter } from "drizzle-orm";

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
  private csvParser: IndiciCSVParser;
  private lineageService: LineageService;
  private errorHandler: ErrorHandler;

  constructor(
    databaseConfig: DatabaseConfig,
    csvParser: IndiciCSVParser,
    lineageService: LineageService,
    errorHandler: ErrorHandler
  ) {
    this.dbPool = new DatabasePool(databaseConfig);
    this.csvParser = csvParser;
    this.lineageService = lineageService;
    this.errorHandler = errorHandler;
  }

  /**
   * Load data from a CSV stream into the raw table
   */
  async loadFromStream(
    stream: Readable,
    fileMetadata: any,
    options: RawLoadOptions & {
      extractType: string;
      tableName: string;
      columnMapping: string[];
    }
  ): Promise<LoadResult> {
    const startTime = Date.now();
    let totalRows = 0;
    let successfulBatches = 0;
    let failedBatches = 0;
    const errors: LoadError[] = [];
    const batchSize = options.batchSize || 1000;

    try {
      // Create parser with default settings to determine the actual columns from the CSV structure
      const dynamicParser = new IndiciCSVParser({
        fieldSeparator:
          options.fieldSeparator || INDICI_CSV_SEPARATORS.FIELD_SEPARATOR,
        rowSeparator:
          options.rowSeparator || INDICI_CSV_SEPARATORS.ROW_SEPARATOR,
        hasHeaders: false,
        columnMapping: [], // Will be determined dynamically from first row
        skipEmptyRows: true,
        maxRowLength: 10000000,
        maxFieldLength: 5000,
      });

      // Parse CSV data into rows, letting the parser handle streaming
      const allCsvRows = await dynamicParser.parseStream(stream);
      totalRows = allCsvRows.length;

      // Process rows in batches using loadRunFileId from options
      if (!options.loadRunFileId) {
        throw new Error("loadRunFileId is required for raw table loading");
      }
      const batches = this.createBatches(
        allCsvRows,
        batchSize,
        options.loadRunFileId,
        options
      );

      console.log(`📦 Created ${batches.length} batches for processing`);

      // Execute batches
      const batchResults = await this.executeBatches(batches, options);

      // Process results
      for (const result of batchResults) {
        if (result.success) {
          successfulBatches++;
        } else {
          failedBatches++;
          if (result.errors) {
            errors.push(...result.errors);
          }
        }
      }

      return {
        totalRows,
        successfulBatches,
        failedBatches,
        errors,
        warnings: [],
        durationMs: Date.now() - startTime,
        bytesProcessed: 0, // Would calculate from stream size
        rowsPerSecond: totalRows / ((Date.now() - startTime) / 1000),
        memoryUsageMB: process.memoryUsage().heapUsed / 1024 / 1024,
      };
    } catch (error) {
      const loadError = await this.errorHandler.handleError(error, {
        operation: "loadFromStream",
        fileMetadata,
        options,
      });

      return {
        totalRows: 0,
        successfulBatches: 0,
        failedBatches: 1,
        errors: [loadError],
        warnings: [],
        durationMs: Date.now() - startTime,
        bytesProcessed: 0,
        rowsPerSecond: 0,
        memoryUsageMB: process.memoryUsage().heapUsed / 1024 / 1024,
      };
    }
  }

  /**
   * Load data from pre-parsed CSV rows
   */
  async loadFromRows(
    rows: CSVRow[],
    fileMetadata: any,
    options: any
  ): Promise<any> {
    const startTime = Date.now();
    let successfulBatches = 0;
    let failedBatches = 0;
    const errors: LoadError[] = [];
    const batchSize = options.batchSize || 1000;

    try {
      // Process rows in batches using loadRunFileId from options
      if (!options.loadRunFileId) {
        throw new Error("loadRunFileId is required for raw table loading");
      }
      const batches = this.createBatches(
        rows,
        batchSize,
        options.loadRunFileId,
        options
      );

      // Execute batches
      const batchResults = await this.executeBatches(batches, options);

      // Process results
      let totalRows = 0;
      for (const result of batchResults) {
        if (result.success) {
          successfulBatches++;
          totalRows += result.rowsInserted;
        } else {
          failedBatches++;
          if (result.errors) {
            errors.push(...result.errors);
          }
        }
      }

      return {
        totalRows,
        successfulBatches,
        failedBatches,
        errors,
        durationMs: Date.now() - startTime,
        bytesProcessed: 0,
        rowsPerSecond: totalRows / ((Date.now() - startTime) / 1000),
        memoryUsageMB: process.memoryUsage().heapUsed / 1024 / 1024,
      };
    } catch (error) {
      const loadError = await this.errorHandler.handleError(error, {
        operation: "loadFromRows",
        fileMetadata,
        options,
      });

      return {
        totalRows: 0,
        successfulBatches: 0,
        failedBatches: 1,
        errors: [loadError],
        warnings: [],
        durationMs: Date.now() - startTime,
        bytesProcessed: 0,
        rowsPerSecond: 0,
        memoryUsageMB: process.memoryUsage().heapUsed / 1024 / 1024,
      };
    }
  }

  /**
   * Calculate optimal batch size based on column count to avoid PostgreSQL parameter limits
   * If the requested batch is too large, reduce it to the optimal batch size
   */
  private calculateOptimalBatchSize(
    columnCount: number,
    requestedBatchSize: number
  ): number {
    const maxParams = 60000; // PostgreSQL limit is 65,535, leave buffer
    const maxRowsForColumns = Math.floor(maxParams / columnCount);
    const optimalBatchSize = Math.min(requestedBatchSize, maxRowsForColumns);

    if (requestedBatchSize < optimalBatchSize) {
      return requestedBatchSize;
    }

    console.log(
      `📊 Reducing batch size from ${requestedBatchSize} to ${optimalBatchSize} due to ${columnCount} columns`
    );
    return optimalBatchSize;
  }

  /**
   * Execute a single batch insert
   */
  async executeBatch(batch: InsertBatch, options: any): Promise<BatchResult> {
    const startTime = Date.now();

    try {
      // Use transaction for batch insert
      const result = await this.dbPool.transaction(async (client) => {
        // Validate batch data first
        if (!batch.values || batch.values.length === 0) {
          throw new Error(`Batch has no values to insert`);
        }

        if (!batch.columns || batch.columns.length === 0) {
          throw new Error(`Batch has no columns defined`);
        }

        // Filter out any empty or invalid rows
        const validRows = batch.values.filter(
          (row) => Array.isArray(row) && row.length === batch.columns.length
        );

        // Check if there are any valid rows
        if (validRows.length === 0) {
          throw new Error(
            `No valid rows found in batch. Original rows: ${batch.values.length}`
          );
        }

        const placeholders = validRows
          .map((_, index) => {
            const paramIndex = index * batch.columns.length + 1;
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
   * Execute multiple batches with retry logic
   */
  async executeBatches(
    batches: InsertBatch[],
    options: any
  ): Promise<BatchResult[]> {
    const results: BatchResult[] = [];
    const maxRetries = options.maxRetries || 3;

    for (const batch of batches) {
      let attempt = 0;
      let success = false;
      let lastError: LoadError | null = null;

      while (attempt < maxRetries && !success) {
        attempt++;

        try {
          const result = await this.executeBatch(batch, options);
          results.push(result);

          if (result.success) {
            success = true;
          } else {
            lastError = result.errors[0] || null;
          }

          // If not successful and not retryable, break
          if (!success && lastError && !lastError.isRetryable) {
            break;
          }
        } catch (error) {
          lastError = await this.errorHandler.handleError(error, {
            operation: "executeBatches",
            batch,
            attempt,
            options,
          });

          // If not retryable, break
          if (!lastError.isRetryable) {
            break;
          }

          // Wait before retry
          if (attempt < maxRetries) {
            await new Promise((resolve) =>
              setTimeout(resolve, options.retryDelayMs || 1000)
            );
          }
        }
      }

      if (!success && lastError) {
        results.push({
          batchNumber: batch.batchNumber,
          rowsInserted: 0,
          errors: [lastError],
          warnings: [],
          durationMs: 0,
          success: false,
        });
      }
    }

    return results;
  }

  /**
   * Create batches from CSV rows
   */
  private createBatches(
    rows: CSVRow[],
    batchSize: number,
    loadRunFileId: number,
    options: any
  ): InsertBatch[] {
    const batches: InsertBatch[] = [];

    if (!options.columnMapping || options.columnMapping.length === 0) {
      throw new Error("Column mapping is required");
    }

    // Calculate optimal batch size based on column count to ensure we don't exceed the PostgreSQL parameter limit
    const optimalBatchSize = this.calculateOptimalBatchSize(
      options.columnMapping.length,
      batchSize
    );

    // Create batches for processing
    for (let i = 0; i < rows.length; i += optimalBatchSize) {
      const batchRows = rows.slice(i, i + optimalBatchSize);

      const batch = this.prepareBatch(
        batchRows,
        loadRunFileId,
        options,
        Math.floor(i / optimalBatchSize) + 1
      );

      batches.push(batch);
    }

    return batches;
  }

  /**
   * Prepare a batch for insertion
   */
  private prepareBatch(
    rows: CSVRow[],
    loadRunFileId: number,
    options: any,
    batchNumber: number
  ): InsertBatch {
    const tableName = options.tableName || `raw.${options.extractType}`;

    if (rows.length === 0) {
      throw new Error("Cannot prepare batch: no rows provided");
    }

    const values: any[][] = [];

    for (const row of rows) {
      // Transform the row to the database row containing columns and values
      const transformedRow = this.transformRow(row, loadRunFileId, options);

      // Map values for all columns (load_run_file_id first, then business columns)
      const rowValues = [
        transformedRow.load_run_file_id,
        ...options.columnMapping.map(
          (col: string) => transformedRow[col] ?? ""
        ),
      ];

      // Add all rows to preserve raw data integrity
      values.push(rowValues);
    }

    return {
      tableName,
      columns: ["load_run_file_id", ...options.columnMapping],
      values,
      rowCount: rows.length,
      batchNumber,
      fileKey: options.loadRunFileId.toString(), // Use loadRunFileId as fileKey for compatibility
      loadRunId: options.loadRunId,
    };
  }

  /**
   * Transform CSV row to database row with loadRunFileId reference
   */
  private transformRow(
    csvRow: CSVRow,
    loadRunFileId: number,
    options: any
  ): RawTableRow {
    // Here we need link each column to the corresponding column in the database
    const columnMapping = options.columnMapping;
    const rowData = csvRow.rawText;
    const rowDataArray = rowData.split(options.fieldSeparator);

    // Transform CSV columns to database columns
    const transformedRow = columnMapping.reduce(
      (acc: any, col: string, index: number) => {
        const value = rowDataArray[index];
        acc[col] = value ?? ""; // Convert undefined/null to empty string for raw data integrity
        return acc;
      },
      {}
    );

    // Create row with foreign key reference to load_run_files
    const row: RawTableRow = {
      load_run_file_id: loadRunFileId,
      ...transformedRow,
    };

    return row;
  }

  /**
   * Close database connections
   */
  async close(): Promise<void> {
    await this.dbPool.close();
  }
}
