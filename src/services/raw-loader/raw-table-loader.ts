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
      // For Indici CSV format, we need to determine the actual columns from the CSV structure
      // Since Indici CSVs don't have headers, we need to extract column info from the data

      // Create parser with default settings (we'll update column mapping after first row)
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

      console.log(`🤖 Debug - First CSV row: `, allCsvRows[0]);

      // Determine column structure from the first actual row
      let actualColumns: string[] = [];
      if (allCsvRows.length > 0) {
        // const firstRow = allCsvRows[0];
        // actualColumns = this.extractColumnsFromCSV(
        //   firstRow.rawText,
        //   options.fieldSeparator || INDICI_CSV_SEPARATORS.FIELD_SEPARATOR,
        //   options.rowSeparator || INDICI_CSV_SEPARATORS.ROW_SEPARATOR,
        //   options.extractType
        // );
        // console.log(
        //   `📊 Detected ${actualColumns.length} columns in CSV: ${actualColumns.join(", ")}`
        // );
        // Note: Column mapping is determined after parsing for validation purposes
        // The parser uses the first row's field count to determine column names
      }

      // Skip the first row if it contains column headers
      // const csvRows = this.skipHeaderRowIfPresent(allCsvRows, actualColumns);
      // console.log(
      //   `📊 Filtered ${allCsvRows.length - csvRows.length} header rows, processing ${csvRows.length} data rows`
      // );

      totalRows = allCsvRows.length;

      // Generate lineage data
      const lineageData = await this.lineageService.generateLineageData(
        fileMetadata,
        options.loadRunId
      );

      console.log(`📊 Processing ${allCsvRows.length} rows from CSV data`);
      console.log(`📋 First row sample:`, allCsvRows[0]);

      // Process rows in batches
      const batches = this.createBatches(
        allCsvRows,
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
    lineageData: LineageData,
    options: any
  ): InsertBatch[] {
    const batches: InsertBatch[] = [];

    // Get column count to calculate optimal batch size
    const columnMapping =
      options.columnMapping ||
      this.getColumnsForExtractType(options.extractType);

    // Calculate optimal batch size based on column count to ensure we don't exceed the PostgreSQL parameter limit
    const optimalBatchSize = this.calculateOptimalBatchSize(
      columnMapping.length,
      batchSize
    );

    // Create batches for processing
    for (let i = 0; i < rows.length; i += optimalBatchSize) {
      const batchRows = rows.slice(i, i + optimalBatchSize);

      const batch = this.prepareBatch(
        batchRows,
        lineageData,
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
    lineageData: LineageData,
    options: any,
    batchNumber: number
  ): InsertBatch {
    const tableName = options.tableName || `raw.${options.extractType}`;

    // Get the full column mapping from the handler
    const fullColumnMapping =
      options.columnMapping ||
      this.getColumnsForExtractType(options.extractType);

    if (rows.length === 0) {
      throw new Error("Cannot prepare batch: no rows provided");
    }

    const values: any[][] = [];

    for (const row of rows) {
      // Transform the row to the database row containing columns and values
      const transformedRow = this.transformRow(row, lineageData, options);

      // Map values for all columns in the column mapping
      const rowValues = fullColumnMapping.map(
        (col: string) => transformedRow[col] ?? ""
      );

      // Add all rows to preserve raw data integrity
      values.push(rowValues);
    }

    return {
      tableName,
      columns: fullColumnMapping, // Use only available columns
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
    // Here we need link each column to the corresponding column in the database
    const columnMapping = options.columnMapping;
    const rowData = csvRow.rawText;
    const rowDataArray = rowData.split(options.fieldSeparator);

    //TODO: Create a db relationship for the lineage columns and use that instead of hardcoding the columns here
    const lineageColumns = this.getLineageColumns();

    const nonLineageColumns = columnMapping.filter(
      (col: string) => !lineageColumns.includes(col)
    );

    const transformedRow = nonLineageColumns.reduce(
      (acc: any, col: string, index: number) => {
        const value = rowDataArray[index];
        acc[col] = value ?? ""; // Convert undefined/null to empty string for raw data integrity
        return acc;
      },
      {}
    );

    //TODO: Add a check to ensure the transformed row has the same length as the non-lineage columns
    // rowDataArray.length === nonLineageColumns.length

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
      ...transformedRow,
    };

    return row;
  }

  /**
   * Get the lineage columns
   */
  private getLineageColumns(): string[] {
    return [
      "s3_bucket",
      "s3_key",
      "s3_version_id",
      "file_hash",
      "date_extracted",
      "extract_type",
      "load_run_id",
      "load_ts",
    ];
  }

  /**
   * Get column names for a specific extract type
   */
  private getColumnsForExtractType(extractType: string): string[] {
    // This would be populated from schema definitions
    const baseColumns = this.getLineageColumns();

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

    // Debug: Check what separators are actually in the data
    // console.log(`🔍 Debug - Field separator: "${fieldSeparator}"`);
    // console.log(`🔍 Debug - Row separator: "${rowSeparator}"`);
    // console.log(`🔍 Debug - First row length: ${firstRow.length}`);
    // console.log(`🔍 Debug - Looking for field separator in first row...`);

    // Check if field separator exists in the data
    const fieldSeparatorIndex = firstRow.indexOf(fieldSeparator);
    // console.log(
    //   `🔍 Debug - Field separator "${fieldSeparator}" found at position: ${fieldSeparatorIndex}`
    // );

    if (fieldSeparatorIndex === -1) {
      // console.log(
      //   `🔍 Debug - Field separator not found! Trying alternative separators...`
      // );
      // Try to detect the actual separator
      const possibleSeparators = ["|^^|", "|~~|", "|", "\t", ",", ";"];
      for (const sep of possibleSeparators) {
        if (firstRow.includes(sep)) {
          console.log(
            `🔍 Debug - Found potential separator: "${sep}" at position ${firstRow.indexOf(sep)}`
          );
        }
      }
    }

    const fieldCount = firstRow.split(fieldSeparator).length;

    console.log(`📊 First CSV row: ${firstRow.substring(0, 200)}...`);
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
    // These must match the database schema column names exactly
    const columnDefinitions: Record<string, string[]> = {
      Patient: [
        "patientId", // patient_id in CSV -> patientId in DB
        "practiceId", // practice_id in CSV -> practiceId in DB
        "nhiNumber", // nhi_number in CSV -> nhiNumber in DB
        "firstName", // first_name in CSV -> firstName in DB
        "familyName", // last_name in CSV -> familyName in DB (note: schema has familyName, not lastName)
        "dob", // date_of_birth in CSV -> dob in DB
        "gender", // gender in CSV -> gender in DB
        "title", // title in CSV -> title in DB
        "middleName", // middle_name in CSV -> middleName in DB
        "fullName", // full_name in CSV -> fullName in DB
        "preferredName", // preferred_name in CSV -> preferredName in DB
        "otherMaidenName", // other_maiden_name in CSV -> otherMaidenName in DB
        "maritalStatusId", // marital_status_id in CSV -> maritalStatusId in DB
        "maritalStatus", // marital_status in CSV -> maritalStatus in DB
        "genderId", // gender_id in CSV -> genderId in DB
        "age", // age in CSV -> age in DB
        // Add more as needed based on actual CSV structure
      ],
      Appointments: [
        "appointmentId", // appointment_id in CSV -> appointmentId in DB
        "patientId", // patient_id in CSV -> patientId in DB
        "providerId", // provider_id in CSV -> providerId in DB
        "appointmentDate", // appointment_date in CSV -> appointmentDate in DB
        "appointmentTime", // appointment_time in CSV -> appointmentTime in DB
        "duration", // duration in CSV -> duration in DB
        "type", // type in CSV -> type in DB
        "status", // status in CSV -> status in DB
        "notes", // notes in CSV -> notes in DB
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
