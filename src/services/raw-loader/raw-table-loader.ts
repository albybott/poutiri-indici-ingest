import { Pool, type QueryResult } from "pg";
import { Readable } from "node:stream";
import type {
  InsertBatch,
  BatchResult,
  RawTableRow,
  LineageData,
  LoadError,
  LoadErrorType,
} from "./types/raw-loader";
import type { DatabaseConfig } from "./types/config";
import type { CSVRow } from "./indici-csv-parser";
import { IndiciCSVParser } from "./indici-csv-parser";
import type { LineageService } from "./lineage-service";
import type { ErrorHandler } from "./error-handler";

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
    options: any
  ): Promise<any> {
    const startTime = Date.now();
    let totalRows = 0;
    let successfulBatches = 0;
    let failedBatches = 0;
    const errors: LoadError[] = [];
    const batchSize = options.batchSize || 1000;

    try {
      // For Indici CSV format, we need to determine the actual columns from the CSV structure
      // Since Indici CSVs don't have headers, we need to extract column info from the data

      // First, let's get a sample of the data to determine column count
      const streamContent = await this.readStreamContent(stream);
      const actualColumns = this.extractColumnsFromCSV(
        streamContent,
        options.fieldSeparator || "|~~|",
        options.rowSeparator || "|^^|",
        options.extractType
      );

      console.log(
        `📊 Detected ${actualColumns.length} columns in CSV: ${actualColumns.join(", ")}`
      );

      // Create a new CSV parser with the correct column mapping
      const dynamicParser = new IndiciCSVParser({
        fieldSeparator: options.fieldSeparator || "|~~|",
        rowSeparator: options.rowSeparator || "|^^|",
        hasHeaders: false,
        columnMapping: actualColumns,
        skipEmptyRows: true,
      });

      // Parse CSV data into rows with the correct column mapping
      const allCsvRows = await dynamicParser.parseStream(
        Readable.from([streamContent])
      );

      // Skip the first row if it contains column headers
      const csvRows = this.skipHeaderRowIfPresent(allCsvRows, actualColumns);
      console.log(
        `📊 Filtered ${allCsvRows.length - csvRows.length} header rows, processing ${csvRows.length} data rows`
      );

      totalRows = csvRows.length;

      // Generate lineage data
      const lineageData = await this.lineageService.generateLineageData(
        fileMetadata,
        options.loadRunId
      );

      console.log(`📊 Processing ${csvRows.length} rows from CSV data`);
      console.log(`📋 First row sample:`, csvRows[0]);
      console.log(`📋 Second row sample:`, csvRows[1]);
      console.log(`📋 Third row sample:`, csvRows[2]);
      console.log(`📋 Fourth row sample:`, csvRows[3]);
      console.log(`📋 Fifth row sample:`, csvRows[4]);
      console.log(`📋 Sixth row sample:`, csvRows[5]);
      console.log(`📋 Seventh row sample:`, csvRows[6]);
      console.log(`📋 Eighth row sample:`, csvRows[7]);
      console.log(`📋 Ninth row sample:`, csvRows[8]);
      console.log(`📋 Tenth row sample:`, csvRows[9]);

      // Process rows in batches
      const batches = this.createBatches(
        csvRows,
        batchSize,
        lineageData,
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
      // Generate lineage data
      const lineageData = await this.lineageService.generateLineageData(
        fileMetadata,
        options.loadRunId
      );

      // Process rows in batches
      const batches = this.createBatches(rows, batchSize, lineageData, options);

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
        durationMs: Date.now() - startTime,
        bytesProcessed: 0,
        rowsPerSecond: 0,
        memoryUsageMB: process.memoryUsage().heapUsed / 1024 / 1024,
      };
    }
  }

  /**
   * Execute a single batch insert
   */
  async executeBatch(batch: InsertBatch, options: any): Promise<BatchResult> {
    const startTime = Date.now();

    try {
      // Use transaction for batch insert
      const result = await this.dbPool.transaction(async (client) => {
        const placeholders = batch.values
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

        const flatValues = batch.values.flat();
        return await client.query(query, flatValues);
      });

      return {
        batchNumber: batch.batchNumber,
        rowsInserted: result.rowCount || 0,
        errors: [],
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
    lineageData: LineageData,
    options: any
  ): InsertBatch[] {
    const batches: InsertBatch[] = [];

    for (let i = 0; i < rows.length; i += batchSize) {
      const batchRows = rows.slice(i, i + batchSize);
      const batch = this.prepareBatch(
        batchRows,
        lineageData,
        options,
        i / batchSize + 1
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
    lineageData: LineageData,
    options: any,
    batchNumber: number
  ): InsertBatch {
    const tableName = options.tableName || `raw.${options.extractType}`;

    // Get the full column mapping from the handler
    const fullColumnMapping =
      options.columnMapping ||
      this.getColumnsForExtractType(options.extractType);

    // Determine which columns actually have data by checking the first row
    if (rows.length === 0) {
      throw new Error("Cannot prepare batch: no rows provided");
    }

    const firstTransformedRow = this.transformRow(
      rows[0],
      lineageData,
      options
    );

    // Debug: Let's see what's in the first CSV row and transformed row
    console.log(`🔍 First CSV row:`, rows[0]);
    console.log(`🔍 First transformed row:`, firstTransformedRow);
    console.log(
      `🔍 First transformed row keys:`,
      Object.keys(firstTransformedRow)
    );

    const availableColumns = fullColumnMapping.filter(
      (col: string) =>
        firstTransformedRow.hasOwnProperty(col) &&
        firstTransformedRow[col] !== undefined
    );

    console.log(
      `📋 Full column mapping has ${fullColumnMapping.length} columns`
    );
    console.log(`📋 Available columns with data: ${availableColumns.length}`);
    console.log(`📋 Available columns: ${availableColumns.join(", ")}`);

    const values: any[][] = [];

    for (const row of rows) {
      const transformedRow = this.transformRow(row, lineageData, options);
      // Only map values for columns that actually exist in the data
      const rowValues = availableColumns.map(
        (col: string) => transformedRow[col]
      );
      values.push(rowValues);
    }

    return {
      tableName,
      columns: availableColumns, // Use only available columns
      values,
      rowCount: rows.length,
      batchNumber,
      fileKey: lineageData.s3Key,
      loadRunId: lineageData.loadRunId,
    };
  }

  /**
   * Transform CSV row to database row with lineage data
   */
  private transformRow(
    csvRow: CSVRow,
    lineageData: LineageData,
    options: any
  ): RawTableRow {
    // Create row with required lineage columns first
    const row: RawTableRow = {
      s3_bucket: lineageData.s3Bucket,
      s3_key: lineageData.s3Key,
      s3_version_id: lineageData.s3VersionId,
      file_hash: lineageData.fileHash,
      date_extracted: lineageData.dateExtracted,
      extract_type: lineageData.extractType,
      load_run_id: lineageData.loadRunId,
      load_ts: lineageData.loadTs,
      // Add CSV data, excluding metadata fields
      ...Object.fromEntries(
        Object.entries(csvRow).filter(
          ([key]) => key !== "rowNumber" && key !== "rawText"
        )
      ),
    };

    return row;
  }

  /**
   * Get column names for a specific extract type
   */
  private getColumnsForExtractType(extractType: string): string[] {
    // This would be populated from schema definitions
    const baseColumns = [
      "s3_bucket",
      "s3_key",
      "s3_version_id",
      "file_hash",
      "date_extracted",
      "extract_type",
      "load_run_id",
      "load_ts",
    ];

    // Add extract-specific columns
    const extractColumns = this.getExtractTypeColumns(extractType);
    return [...baseColumns, ...extractColumns];
  }

  /**
   * Get extract type specific columns
   */
  private getExtractTypeColumns(extractType: string): string[] {
    // This would be populated from schema metadata
    // For now, return common columns
    return [
      "patient_id",
      "practice_id",
      "created_date",
      "modified_date",
      "data",
    ];
  }

  /**
   * Read stream content into a string
   */
  private async readStreamContent(stream: Readable): Promise<string> {
    const chunks: string[] = [];

    return new Promise((resolve, reject) => {
      stream.on("data", (chunk) => {
        // Handle both string and Buffer chunks
        const chunkStr = typeof chunk === "string" ? chunk : chunk.toString();
        chunks.push(chunkStr);
      });
      stream.on("end", () => resolve(chunks.join("")));
      stream.on("error", reject);
    });
  }

  /**
   * Extract column names from CSV content based on extract type
   */
  private extractColumnsFromCSV(
    content: string,
    fieldSeparator: string,
    rowSeparator: string,
    extractType: string
  ): string[] {
    // Split into rows and get the first row to determine column count
    const rows = content.split(rowSeparator);
    if (rows.length === 0) {
      return [];
    }

    const firstRow = rows[0].trim();
    const fieldCount = firstRow.split(fieldSeparator).length;

    console.log(`📊 First CSV row: ${firstRow.substring(0, 100)}...`);
    console.log(`📊 Detected ${fieldCount} fields in CSV`);

    // Map field positions to column names based on extract type
    return this.getColumnNamesForExtractType(extractType, fieldCount);
  }

  /**
   * Skip the first row if it contains column headers
   */
  private skipHeaderRowIfPresent(
    rows: CSVRow[],
    expectedColumns: string[]
  ): CSVRow[] {
    if (rows.length === 0) {
      return rows;
    }

    const firstRow = rows[0];

    // Check if the first row contains column names by comparing values to expected column names
    const isHeaderRow = expectedColumns.some((colName) => {
      const firstRowValue = firstRow[colName];
      // If the value in the first row matches the column name, it's likely a header
      return (
        typeof firstRowValue === "string" &&
        firstRowValue.toLowerCase() === colName.toLowerCase()
      );
    });

    if (isHeaderRow) {
      console.log(`📊 Detected header row, skipping first row`);
      console.log(
        `📊 Header row values: ${Object.values(firstRow)
          .filter(
            (v) =>
              typeof v === "string" &&
              v !== firstRow.rawText &&
              typeof v !== "number"
          )
          .join(", ")}`
      );
      return rows.slice(1); // Skip the first row
    }

    console.log(`📊 First row appears to be data, keeping all rows`);
    return rows;
  }

  /**
   * Get column names for extract type with specific field count
   */
  private getColumnNamesForExtractType(
    extractType: string,
    fieldCount: number
  ): string[] {
    // Define the expected column order for each extract type
    const columnDefinitions: Record<string, string[]> = {
      Patient: [
        "patient_id",
        "practice_id",
        "nhi_number",
        "first_name",
        "last_name",
        "date_of_birth",
        "gender",
        "title",
        "middle_name",
        "family_name",
        "full_name",
        "preferred_name",
        "other_maiden_name",
        "marital_status_id",
        "marital_status",
        "gender_id",
        "dob",
        "age",
        // Add more as needed based on actual CSV structure
      ],
      Appointments: [
        "appointment_id",
        "patient_id",
        "provider_id",
        "appointment_date",
        "appointment_time",
        "duration",
        "type",
        "status",
        "notes",
      ],
    };

    const availableColumns = columnDefinitions[extractType] || [];

    // Return only the number of columns that match the field count
    const selectedColumns = availableColumns.slice(0, fieldCount);

    console.log(
      `📊 Selected columns for ${extractType} (${fieldCount} fields): ${selectedColumns.join(", ")}`
    );

    return selectedColumns;
  }

  /**
   * Close database connections
   */
  async close(): Promise<void> {
    await this.dbPool.close();
  }
}
