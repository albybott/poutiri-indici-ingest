import { Readable } from "node:stream";
import type {
  RawLoadOptions,
  LoadResult,
  LoadProgress,
  LoadMetrics,
  ProcessingPlanResult,
  ProcessingBatchResult,
} from "./types/raw-loader";
import { LoadStatus } from "./types/raw-loader";
import {
  LoadErrorType,
  type LoadError,
  type LoadWarning,
} from "@/services/shared/types";
import type {
  DiscoveredFile,
  FileBatch,
} from "../../services/discovery/types/files";
import type { ProcessingPlan } from "../../services/discovery/types/discovery";
import type { FileSystemAdapter } from "../../services/discovery/adapters/file-system-adapter";
import type { RawLoaderConfig } from "./types/config";
import { RawTableLoader } from "./raw-table-loader";
import { ExtractHandlerFactory } from "./extract-handler-factory";
import { IdempotencyService } from "./idempotency-service";
import { LineageService } from "./lineage-service";
import { ErrorHandler } from "./error-handler";
import { LoadMonitor } from "./load-monitor";
import type { Logger } from "../shared/utils/logger";

/**
 * Main Raw Loader Service - orchestrates the entire loading process
 */
export class RawLoaderService {
  private config: RawLoaderConfig;
  private idempotencyService: IdempotencyService;
  // private lineageService: LineageService;
  private errorHandler: ErrorHandler;
  private monitor: LoadMonitor;
  private fileSystemAdapter: FileSystemAdapter;
  private logger: Logger;
  public tableLoader: RawTableLoader;
  public handlerFactory: ExtractHandlerFactory;

  constructor(
    // csvParser: CSVParser,
    tableLoader: RawTableLoader,
    handlerFactory: ExtractHandlerFactory,
    idempotencyService: IdempotencyService,
    // lineageService: LineageService,
    errorHandler: ErrorHandler,
    monitor: LoadMonitor,
    fileSystemAdapter: FileSystemAdapter,
    config: RawLoaderConfig,
    logger: Logger
  ) {
    this.config = config;
    this.tableLoader = tableLoader;
    this.handlerFactory = handlerFactory;
    this.idempotencyService = idempotencyService;
    // this.lineageService = lineageService;
    this.errorHandler = errorHandler;
    this.monitor = monitor;
    this.fileSystemAdapter = fileSystemAdapter;
    this.logger = logger;
  }

  /**
   * Load a single file from S3
   */
  async loadFile(
    file: DiscoveredFile,
    loadRunId: string,
    options: Partial<RawLoadOptions>
  ): Promise<LoadResult> {
    // Build load options ensuring defaults are set if not provided
    const loadOptions = this.applyLoadOptionDefaults(loadRunId, options);

    this.logger.warn(
      `✅ File already processed, forcing reprocessing: ${file.s3Key}`
    );

    try {
      // Check idempotency, this is to ensure we don't load the same file multiple times
      const idempotencyCheck =
        await this.idempotencyService.checkFileProcessed(file);

      if (idempotencyCheck.isProcessed) {
        if (this.config.processing.forceReprocess) {
          this.logger.warn(
            `✅ File already processed, forcing reprocessing: ${file.s3Key}`
          );
        } else {
          console.log(`✅ File already processed, skipping: ${file.s3Key}`);
          return {
            totalRows: idempotencyCheck.rowCount || 0,
            successfulBatches: 1,
            failedBatches: 0,
            errors: [],
            warnings: [
              {
                message: `File was already processed in load run ${idempotencyCheck.loadRunId}`,
                fileKey: file.s3Key,
                timestamp: new Date(),
                severity: "low",
              },
            ],
            durationMs: 0,
            bytesProcessed: 0,
            rowsPerSecond: 0,
            memoryUsageMB: 0,
          };
        }
      }

      // Mark file as being processed and get the loadRunFileId for foreign key relationships
      const loadRunFileId = await this.idempotencyService.markFileProcessing(
        file,
        loadRunId
      );

      // Get extract handler, a handler is a function that will be used to load the data into the database
      const handler = await this.handlerFactory.getHandler(
        file.parsed.extractType
      );

      // Get file stream (this would come from S3 adapter)
      const stream = await this.getFileStream(file);

      // Load the data into the database from the stream
      const result = await this.tableLoader.loadFromStream(stream, {
        ...loadOptions,
        extractType: file.parsed.extractType,
        tableName: handler.tableName,
        loadRunFileId,
        columns: handler.columnMapping,
      });

      // Mark as completed if successful
      if (result.successfulBatches > 0) {
        await this.idempotencyService.markFileCompleted(
          file,
          loadRunId,
          result.totalRows
        );
      }

      return result;
    } catch (error) {
      const loadError = await this.errorHandler.handleError(error, {
        operation: "loadFile",
        fileMetadata: file,
        loadOptions,
      });

      // Mark file as failed in idempotency service
      try {
        await this.idempotencyService.markFileError(
          file,
          loadRunId,
          loadError.message
        );
      } catch (idempotencyError) {
        console.error(
          "Failed to mark file as failed in idempotency service:",
          idempotencyError
        );
      }

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
    // Build load options ensuring defaults are set if not provided
    const loadOptions = this.applyLoadOptionDefaults(loadRunId, options);

    // Get max concurrent files from options or config
    const maxConcurrent =
      loadOptions.maxConcurrentFiles ??
      this.config.processing.maxConcurrentFiles;

    // Initialize results array, this will store the results of each file load
    const results: LoadResult[] = [];
    const startTime = new Date(); // Track overall start time
    let totalFilesProcessed = 0;

    console.log(
      `📦 Starting batch load: ${files.length} files, max concurrent: ${maxConcurrent}`
    );

    // Take all the files and put them into batches of maxConcurrent so that we can process them in parallel
    for (let i = 0; i < files.length; i += maxConcurrent) {
      // Get the batch of files to process, we process in batches to control concurrency
      const batch = files.slice(i, i + maxConcurrent);
      const batchNum = Math.floor(i / maxConcurrent) + 1;
      const totalBatches = Math.ceil(files.length / maxConcurrent);

      console.log(
        `🔄 Processing batch ${batchNum}/${totalBatches} (${batch.length} files)`
      );

      // Create an array of promises for each file in the batch, this will allow us to process the files in parallel
      const batchPromises = batch.map((file) =>
        // This function is where we load the file into the database
        this.loadFile(file, loadRunId, loadOptions)
      );

      // Use Promise.allSettled for better error resilience
      const batchResults = await Promise.allSettled(batchPromises);

      // Handle both fulfilled and rejected promises
      for (const result of batchResults) {
        if (result.status === "fulfilled") {
          results.push(result.value);
        } else {
          // Unexpected rejection (loadFile should catch its errors)
          console.error("Unexpected promise rejection:", result.reason);
          results.push({
            totalRows: 0,
            successfulBatches: 0,
            failedBatches: 1,
            errors: [
              {
                errorType: LoadErrorType.DATABASE_ERROR,
                message: result.reason?.message ?? "Unknown error",
                timestamp: new Date(),
                isRetryable: false,
              },
            ],
            warnings: [],
            durationMs: 0,
            bytesProcessed: 0,
            rowsPerSecond: 0,
            memoryUsageMB: 0,
          });
        }
      }

      totalFilesProcessed += batch.length;

      // Update progress with accurate metrics
      if (this.config.monitoring.enableProgressTracking) {
        const aggregatedMetrics = this.aggregateResults(results);

        await this.monitor.updateProgress({
          fileKey: `batch_operation_${loadRunId}`,
          extractType: files[0]?.parsed.extractType ?? "multiple",
          totalRows: aggregatedMetrics.totalRows,
          processedRows: aggregatedMetrics.totalRows,
          currentBatch: batchNum,
          totalBatches,
          estimatedTimeRemaining: this.estimateTimeRemaining(
            startTime,
            totalFilesProcessed,
            files.length
          ),
          currentStatus: LoadStatus.PROCESSING,
          errors: aggregatedMetrics.errors,
          warnings: aggregatedMetrics.warnings,
          bytesProcessed: aggregatedMetrics.bytesProcessed,
          memoryUsageMB: aggregatedMetrics.memoryUsageMB,
          startTime,
          lastUpdate: new Date(),
        });
      }
    }

    const aggregated = this.aggregateResults(results);
    console.log(
      `✅ Batch load complete: ${results.length} files, ${aggregated.totalRows} rows, ` +
        `${aggregated.successfulBatches} successful batches, ${aggregated.failedBatches} failed batches`
    );

    return results;
  }

  /**
   * Load multiple batches of files from a processing plan
   * Processes each batch sequentially, with configurable concurrency within each batch
   */
  async loadBatches(
    batches: FileBatch[],
    loadRunId: string,
    options?: Partial<RawLoadOptions>
  ): Promise<ProcessingPlanResult> {
    // Build load options ensuring defaults are set if not provided
    const loadOptions = this.applyLoadOptionDefaults(loadRunId, options);

    const startedAt = new Date();
    const batchResults: ProcessingBatchResult[] = [];
    let totalFilesProcessed = 0;
    let totalRowsProcessed = 0;
    let totalSuccessfulFiles = 0;
    let totalFailedFiles = 0;
    let batchesProcessed = 0;
    let batchesFailed = 0;

    console.log(
      `📦 Starting batch processing: ${batches.length} batches, load run: ${loadRunId}`
    );

    // Process each batch sequentially
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const batchStartTime = new Date();

      if (batch.files.length === 0) {
        console.log(
          `⚠️  Batch ${batchIndex + 1}/${batches.length} (${batch.batchId}) has no files, skipping`
        );
        continue;
      }

      console.log(
        `🔄 Processing batch ${batchIndex + 1}/${batches.length} (${batch.batchId}) with ${batch.files.length} files`
      );

      try {
        // Load all files in this batch using existing loadMultipleFiles method
        const fileResults = await this.loadMultipleFiles(
          batch.files,
          loadRunId,
          loadOptions
        );

        const batchDuration = Date.now() - batchStartTime.getTime();
        const batchTotalRows = fileResults.reduce(
          (sum, r) => sum + r.totalRows,
          0
        );
        const batchSuccessfulFiles = fileResults.filter(
          (r) => r.successfulBatches > 0
        ).length;
        const batchFailedFiles = fileResults.filter(
          (r) => r.failedBatches > 0
        ).length;

        // Aggregate errors and warnings from all file results
        const batchErrors = fileResults.flatMap((r) => r.errors);
        const batchWarnings = fileResults.flatMap((r) => r.warnings);

        const batchResult: ProcessingBatchResult = {
          batchIndex,
          batchId: batch.batchId,
          fileResults,
          totalFiles: batch.files.length,
          totalRows: batchTotalRows,
          successfulFiles: batchSuccessfulFiles,
          failedFiles: batchFailedFiles,
          durationMs: batchDuration,
          errors: batchErrors,
          warnings: batchWarnings,
        };

        batchResults.push(batchResult);
        batchesProcessed++;
        totalFilesProcessed += batch.files.length;
        totalRowsProcessed += batchTotalRows;
        totalSuccessfulFiles += batchSuccessfulFiles;
        totalFailedFiles += batchFailedFiles;

        console.log(
          `✅ Batch ${batchIndex + 1} completed: ${batchSuccessfulFiles}/${batch.files.length} files successful, ` +
            `${batchTotalRows} rows, ${batchErrors.length} errors`
        );

        // Update progress if monitoring is enabled
        if (this.config.monitoring.enableProgressTracking) {
          await this.monitor.updateProgress({
            fileKey: `batch_${batch.batchId}_${loadRunId}`,
            extractType: "batch_processing",
            totalRows: totalRowsProcessed,
            processedRows: totalRowsProcessed,
            currentBatch: batchIndex + 1,
            totalBatches: batches.length,
            estimatedTimeRemaining: this.estimateTimeRemaining(
              startedAt,
              totalFilesProcessed,
              batches.reduce((sum, b) => sum + b.files.length, 0)
            ),
            currentStatus: LoadStatus.PROCESSING,
            errors: batchErrors,
            warnings: batchWarnings,
            bytesProcessed: fileResults.reduce(
              (sum, r) => sum + r.bytesProcessed,
              0
            ),
            memoryUsageMB: Math.max(...fileResults.map((r) => r.memoryUsageMB)),
            startTime: startedAt,
            lastUpdate: new Date(),
          });
        }
      } catch (error) {
        const batchDuration = Date.now() - batchStartTime.getTime();
        console.error(
          `❌ Batch ${batchIndex + 1} (${batch.batchId}) failed:`,
          error
        );

        // Create a failed batch result
        const batchResult: ProcessingBatchResult = {
          batchIndex,
          batchId: batch.batchId,
          fileResults: [],
          totalFiles: batch.files.length,
          totalRows: 0,
          successfulFiles: 0,
          failedFiles: batch.files.length,
          durationMs: batchDuration,
          errors: [
            {
              errorType: LoadErrorType.DATABASE_ERROR,
              message:
                error instanceof Error
                  ? error.message
                  : "Unknown batch processing error",
              timestamp: new Date(),
              isRetryable: false,
            },
          ],
          warnings: [],
        };

        batchResults.push(batchResult);
        batchesFailed++;
        totalFilesProcessed += batch.files.length;
        totalFailedFiles += batch.files.length;

        // Continue processing other batches if continueOnError is enabled
        if (!loadOptions.continueOnError) {
          console.error(
            "❌ Stopping batch processing due to error and continueOnError=false"
          );
          break;
        }
      }
    }

    const completedAt = new Date();
    const overallDuration = completedAt.getTime() - startedAt.getTime();

    // Aggregate all errors and warnings from all batches
    const allErrors = batchResults.flatMap((br) => br.errors);
    const allWarnings = batchResults.flatMap((br) => br.warnings);

    const result: ProcessingPlanResult = {
      totalBatches: batches.length,
      batchesProcessed,
      batchesFailed,
      totalFiles: totalFilesProcessed,
      totalRows: totalRowsProcessed,
      successfulFiles: totalSuccessfulFiles,
      failedFiles: totalFailedFiles,
      batchResults,
      overallDuration,
      errors: allErrors,
      warnings: allWarnings,
      startedAt,
      completedAt,
    };

    console.log(
      `🎉 Batch processing complete: ${batchesProcessed}/${batches.length} batches processed, ` +
        `${totalSuccessfulFiles}/${totalFilesProcessed} files successful, ` +
        `${totalRowsProcessed} total rows, ${allErrors.length} total errors`
    );

    return result;
  }

  /**
   * Helper method to aggregate results from multiple files
   */
  private aggregateResults(results: LoadResult[]) {
    return results.reduce(
      (acc, result) => ({
        totalRows: acc.totalRows + (result.totalRows ?? 0),
        successfulBatches:
          acc.successfulBatches + (result.successfulBatches ?? 0),
        failedBatches: acc.failedBatches + (result.failedBatches ?? 0),
        errors: [...acc.errors, ...(result.errors ?? [])],
        warnings: [...acc.warnings, ...(result.warnings ?? [])],
        bytesProcessed: acc.bytesProcessed + (result.bytesProcessed ?? 0),
        memoryUsageMB: Math.max(acc.memoryUsageMB, result.memoryUsageMB ?? 0),
        durationMs: acc.durationMs + (result.durationMs ?? 0),
        rowsPerSecond: 0, // Calculated separately if needed
      }),
      {
        totalRows: 0,
        successfulBatches: 0,
        failedBatches: 0,
        errors: [] as LoadError[],
        warnings: [] as LoadWarning[],
        bytesProcessed: 0,
        memoryUsageMB: 0,
        durationMs: 0,
        rowsPerSecond: 0,
      }
    );
  }

  /**
   * Helper method to estimate remaining processing time
   */
  private estimateTimeRemaining(
    startTime: Date,
    processedFiles: number,
    totalFiles: number
  ): number {
    if (processedFiles === 0) return 0;

    const elapsedMs = Date.now() - startTime.getTime();
    const avgTimePerFile = elapsedMs / processedFiles;
    const remainingFiles = totalFiles - processedFiles;

    return Math.round((avgTimePerFile * remainingFiles) / 1000); // Return seconds
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

  private applyLoadOptionDefaults(
    loadRunId: string,
    options?: Partial<RawLoadOptions>
  ): RawLoadOptions {
    return {
      loadRunId,
      batchSize: options?.batchSize || this.config.processing.batchSize,
      maxRetries: options?.maxRetries || this.config.errorHandling.maxRetries,
      continueOnError:
        options?.continueOnError ?? this.config.errorHandling.continueOnError,
      validateRowCount: options?.validateRowCount ?? true,
      skipValidation: options?.skipValidation ?? false,
      maxConcurrentFiles: options?.maxConcurrentFiles,
    };
  }

  async getFileStream(fileMetadata: DiscoveredFile): Promise<Readable> {
    console.log(`📁 Attempting to get file stream for: ${fileMetadata.s3Key}`);
    console.log(`🔍 Extract type: ${fileMetadata.parsed.extractType}`);
    console.log(`📦 Bucket: ${fileMetadata.s3Bucket}`);

    try {
      // Get the actual file stream from S3 using the file system adapter
      const stream = await this.fileSystemAdapter.getFileStream(
        fileMetadata.s3Key
      );
      console.log(`✅ Successfully retrieved file stream from S3`);

      // Convert NodeJS.ReadableStream to web Readable if needed
      // Note: This assumes the S3 adapter returns NodeJS.ReadableStream
      // If we need web Readable, we might need to wrap it
      return stream as Readable;
    } catch (error) {
      console.error(`❌ Failed to get file stream from S3:`, error);
      throw new Error(
        `Failed to retrieve file stream for ${fileMetadata.s3Key}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
