import { Readable } from "node:stream";
import type {
  RawLoadOptions,
  LoadResult,
  LoadProgress,
  LoadMetrics,
  RawTableRow,
  InsertBatch,
  BatchResult,
  LoadStatus,
} from "./types/raw-loader";
import type { DiscoveredFile } from "../../services/discovery/types/files";
import type { RawLoaderConfig } from "./types/config";
import { IndiciCSVParser } from "./indici-csv-parser";
import { RawTableLoader } from "./raw-table-loader";
import { ExtractHandlerFactory } from "./extract-handler-factory";
import { IdempotencyService } from "./idempotency-service";
import { LineageService } from "./lineage-service";
import { ErrorHandler } from "./error-handler";
import { LoadMonitor } from "./load-monitor";

/**
 * Main Raw Loader Service - orchestrates the entire loading process
 */
export class RawLoaderService {
  private config: RawLoaderConfig;
  private csvParser: IndiciCSVParser;
  private tableLoader: RawTableLoader;
  private handlerFactory: ExtractHandlerFactory;
  private idempotencyService: IdempotencyService;
  private lineageService: LineageService;
  private errorHandler: ErrorHandler;
  private monitor: LoadMonitor;

  constructor(
    csvParser: IndiciCSVParser,
    tableLoader: RawTableLoader,
    handlerFactory: ExtractHandlerFactory,
    idempotencyService: IdempotencyService,
    lineageService: LineageService,
    errorHandler: ErrorHandler,
    monitor: LoadMonitor,
    config: RawLoaderConfig
  ) {
    this.config = config;
    this.csvParser = csvParser;
    this.tableLoader = tableLoader;
    this.handlerFactory = handlerFactory;
    this.idempotencyService = idempotencyService;
    this.lineageService = lineageService;
    this.errorHandler = errorHandler;
    this.monitor = monitor;
  }

  /**
   * Load a single file from S3
   */
  async loadFile(
    fileMetadata: DiscoveredFile,
    loadRunId: string,
    options?: Partial<RawLoadOptions>
  ): Promise<LoadResult> {
    const loadOptions = this.buildLoadOptions(loadRunId, options);

    try {
      // Check idempotency
      const idempotencyCheck =
        await this.idempotencyService.checkFileProcessed(fileMetadata);
      if (idempotencyCheck.isProcessed && loadOptions.skipValidation !== true) {
        return {
          totalRows: 0,
          successfulBatches: 0,
          failedBatches: 0,
          errors: [],
          warnings: [],
          durationMs: 0,
          bytesProcessed: 0,
          rowsPerSecond: 0,
          memoryUsageMB: 0,
        };
      }

      // Get extract handler
      const handler = await this.handlerFactory.getHandler(
        fileMetadata.parsed.extractType
      );

      // Generate lineage data
      const lineageData = await this.lineageService.generateLineageData(
        fileMetadata,
        loadRunId
      );

      // Get file stream (this would come from S3 adapter)
      const stream = await this.getFileStream(fileMetadata);

      // Load the data
      const result = await this.tableLoader.loadFromStream(
        stream,
        fileMetadata,
        {
          ...loadOptions,
          extractType: fileMetadata.parsed.extractType,
          tableName: handler.tableName,
          columnMapping: handler.columnMapping,
        }
      );

      // Mark as completed if successful
      if (result.successfulBatches > 0) {
        await this.idempotencyService.markFileCompleted(
          fileMetadata,
          loadRunId,
          result.totalRows
        );
      }

      return result;
    } catch (error) {
      const loadError = await this.errorHandler.handleError(error, {
        operation: "loadFile",
        fileMetadata,
        loadOptions,
      });

      return {
        totalRows: 0,
        successfulBatches: 0,
        failedBatches: 1,
        errors: [loadError],
        warnings: [],
        durationMs: 0,
        bytesProcessed: 0,
        rowsPerSecond: 0,
        memoryUsageMB: 0,
      };
    }
  }

  /**
   * Load multiple files in parallel
   */
  async loadMultipleFiles(
    files: DiscoveredFile[],
    loadRunId: string,
    options?: Partial<RawLoadOptions>
  ): Promise<LoadResult[]> {
    const loadOptions = this.buildLoadOptions(loadRunId, options);
    const maxConcurrent =
      loadOptions.maxConcurrentFiles ??
      this.config.processing.maxConcurrentFiles;

    // Process files in batches to control concurrency
    const results: LoadResult[] = [];

    for (let i = 0; i < files.length; i += maxConcurrent) {
      const batch = files.slice(i, i + maxConcurrent);
      const batchPromises = batch.map((file) =>
        this.loadFile(file, loadRunId, loadOptions)
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Update progress
      if (this.config.monitoring.enableProgressTracking) {
        await this.monitor.updateProgress({
          fileKey: `batch_${i}`,
          extractType: "batch",
          totalRows: files.length,
          processedRows: i + batch.length,
          currentBatch: Math.floor(i / maxConcurrent) + 1,
          totalBatches: Math.ceil(files.length / maxConcurrent),
          estimatedTimeRemaining: 0,
          currentStatus: "PROCESSING" as LoadStatus,
          errors: [],
          warnings: [],
          bytesProcessed: 0,
          memoryUsageMB: 0,
          startTime: new Date(),
          lastUpdate: new Date(),
        });
      }
    }

    return results;
  }

  /**
   * Get load progress for a specific file
   */
  async getLoadProgress(fileKey: string): Promise<LoadProgress> {
    // Retrieve progress from the monitor
    const progress = await this.monitor.getProgress(fileKey);

    if (progress) {
      return progress;
    }

    // Return default progress if not found
    return {
      fileKey,
      extractType: "unknown",
      totalRows: 0,
      processedRows: 0,
      currentBatch: 0,
      totalBatches: 0,
      estimatedTimeRemaining: 0,
      currentStatus: "PENDING" as LoadStatus,
      errors: [],
      warnings: [],
      bytesProcessed: 0,
      memoryUsageMB: 0,
      startTime: new Date(),
      lastUpdate: new Date(),
    };
  }

  /**
   * Get error summary for a load result
   */
  async getErrorSummary(errors: any[]): Promise<any> {
    // Aggregate and summarize errors using the error handler
    const summary = await this.errorHandler.getErrorSummary(errors);

    return {
      totalErrors: errors.length,
      errorsByType: summary.errorsByType || {},
      topErrors: summary.topErrors || errors.slice(0, 10),
      retryableErrors: errors.filter((e) => e.isRetryable).length,
      blockingErrors: errors.filter((e) => !e.isRetryable).length,
    };
  }

  /**
   * Get current metrics
   */
  async getMetrics(): Promise<LoadMetrics> {
    // This would retrieve metrics from the monitor
    return {
      filesProcessed: 0,
      totalRowsLoaded: 0,
      totalBytesProcessed: 0,
      averageRowsPerSecond: 0,
      averageProcessingTimeMs: 0,
      errorRate: 0,
      retryCount: 0,
      memoryPeakUsageMB: 0,
      databaseConnectionsUsed: 0,
      throughputMBps: 0,
      averageLatencyMs: 0,
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Check monitor health
      const isMonitorHealthy = await this.monitor.healthCheck();

      // Check database connectivity if environment variables are set
      const dbHost = process.env.DB_HOST;
      const dbPort = process.env.DB_PORT;
      const dbName = process.env.DB_NAME;
      const dbUser = process.env.DB_USER;
      const dbPassword = process.env.DB_PASSWORD;

      if (dbHost && dbPort && dbName && dbUser && dbPassword) {
        console.log("🔌 Testing database connection...");
        const pool = new (await import("pg")).Pool({
          host: dbHost,
          port: parseInt(dbPort),
          database: dbName,
          user: dbUser,
          password: dbPassword,
          max: 1,
        });

        try {
          await pool.query("SELECT 1");
          console.log("✅ Database connection successful");
        } catch (dbError) {
          console.error("❌ Database connection failed:", dbError);
          return false;
        } finally {
          await pool.end();
        }
      } else {
        console.log(
          "⚠️ Database environment variables not set, skipping connection test",
          {
            dbHost,
            dbPort,
            dbName,
            dbUser,
            dbPassword,
          }
        );
        console.log(
          "💡 Required: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD"
        );
      }

      return isMonitorHealthy;
    } catch (error) {
      return false;
    }
  }

  // Private helper methods

  private buildLoadOptions(
    loadRunId: string,
    options?: Partial<RawLoadOptions>
  ): RawLoadOptions {
    return {
      extractType: "",
      loadRunId,
      batchSize: options?.batchSize || this.config.processing.batchSize,
      maxRetries: options?.maxRetries || this.config.errorHandling.maxRetries,
      continueOnError:
        options?.continueOnError ?? this.config.errorHandling.continueOnError,
      validateRowCount: options?.validateRowCount ?? true,
      skipValidation: options?.skipValidation ?? false,
    };
  }

  private async getFileStream(fileMetadata: DiscoveredFile): Promise<Readable> {
    // This would be implemented to get the actual file stream from S3
    // For now, return a mock stream with sample data for testing
    console.log(`📁 Attempting to get file stream for: ${fileMetadata.s3Key}`);
    console.log(`🔍 Extract type: ${fileMetadata.parsed.extractType}`);

    // Create a mock CSV stream for testing
    const sampleData = this.generateSampleCSVData(
      fileMetadata.parsed.extractType
    );
    return Readable.from([sampleData]);
  }

  private generateSampleCSVData(extractType: string): string {
    console.log(`📊 Generating sample data for extract type: ${extractType}`);

    // For Patient extract, these are the actual columns in the CSV
    const patientColumns = [
      "patient_id",
      "practice_id",
      "nhi_number",
      "first_name",
      "last_name",
      "date_of_birth",
      "gender",
    ];

    // For other extracts
    const appointmentColumns = [
      "appointment_id",
      "patient_id",
      "provider_id",
      "appointment_date",
      "appointment_time",
      "duration",
    ];

    const columns =
      extractType === "Patient" ? patientColumns : appointmentColumns;
    const headers = columns.join("|~~|") + "|^^|";

    const sampleRows =
      extractType === "Patient"
        ? [
            "12345|~~|535|~~|ABC1234|~~|John|~~|Doe|~~|1985-06-15|~~|M",
            "67890|~~|535|~~|DEF5678|~~|Jane|~~|Smith|~~|1990-08-20|~~|F",
            "11111|~~|535|~~|GHI9012|~~|Bob|~~|Johnson|~~|1978-12-10|~~|M",
          ]
        : [
            "A001|~~|12345|~~|P001|~~|2025-01-15|~~|10:00|~~|30",
            "A002|~~|67890|~~|P002|~~|2025-01-16|~~|14:30|~~|45",
            "A003|~~|11111|~~|P001|~~|2025-01-17|~~|09:15|~~|60",
          ];

    const csvData = headers + sampleRows.join("|^^|");
    console.log(`📄 Generated CSV data: ${csvData.substring(0, 100)}...`);
    console.log(`📏 CSV data length: ${csvData.length} characters`);
    console.log(`📄 CSV columns: ${columns.join(", ")}`);

    return csvData;
  }
}

/**
 * Raw Loader Container - Dependency Injection Container
 * Creates and wires up all Raw Loader dependencies
 */
export class RawLoaderContainer {
  static create(config: RawLoaderConfig): RawLoaderService {
    // Create CSV parser options from config (columnMapping will be provided by handler)
    const csvOptions = {
      fieldSeparator: config.csv.fieldSeparator,
      rowSeparator: config.csv.rowSeparator,
      hasHeaders: config.csv.hasHeaders,
      columnMapping: [], // Will be set by extract handler
      maxRowLength: config.csv.maxRowLength,
      skipEmptyRows: config.csv.skipEmptyRows ?? true, // Default to true if undefined
    };

    const csvParser = new IndiciCSVParser(csvOptions);
    const lineageService = new LineageService();
    const errorHandler = new ErrorHandler(config.errorHandling);
    const monitor = new LoadMonitor(config.monitoring);
    const tableLoader = new RawTableLoader(
      config.database,
      csvParser,
      lineageService,
      errorHandler
    );
    const handlerFactory = new ExtractHandlerFactory();
    const idempotencyService = new IdempotencyService();

    return new RawLoaderService(
      csvParser,
      tableLoader,
      handlerFactory,
      idempotencyService,
      lineageService,
      errorHandler,
      monitor,
      config
    );
  }
}
