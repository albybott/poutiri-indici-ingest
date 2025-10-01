import { Readable } from "node:stream";
import type { BatchResult, LoadError, LoadWarning } from "./types";

type CSVRowValue = string | number | boolean | Date;

/**
 * Configuration for stream batch processing
 */
export interface StreamProcessingOptions {
  batchSize: number;
  maxQueueSize?: number;
  progressLogInterval?: number;
}

/**
 * Callback function type for processing batches
 */
export type BatchExecutor<T> = (
  batch: T[],
  batchNumber: number
) => Promise<BatchResult>;

/**
 * Result of stream processing
 */
export interface StreamLoadResult {
  totalRows: number;
  successfulBatches: number;
  failedBatches: number;
  errors: LoadError[];
  warnings: LoadWarning[];
  durationMs: number;
  bytesProcessed: number;
  rowsPerSecond: number;
  memoryUsageMB: number;
}

/**
 * Generic stream batch processor
 * Handles stream processing with batching, backpressure management, and progress tracking.
 *
 * This service is layer-agnostic and can be used for:
 * - Raw layer: CSV streams from S3
 * - Staging layer: Query result streams from raw tables
 * - Core layer: Query result streams from staging tables
 *
 * Features:
 * - Stream event coordination (data, end, error)
 * - Batch accumulation and queue management
 * - Backpressure control (pause/resume)
 * - Async batch processing coordination
 * - Progress monitoring and memory tracking
 */
export class StreamBatchProcessor {
  /**
   * Process a readable stream with batching and backpressure management
   *
   * @param stream - The readable stream to process
   * @param parser - Parser that transforms stream into data events (e.g., CSV parser)
   * @param batchExecutor - Async function that processes each batch
   * @param options - Processing configuration
   * @returns Load result with statistics and errors
   */
  async processStream<T = CSVRowValue[]>(
    stream: Readable,
    parser: { parser: NodeJS.ReadWriteStream },
    batchExecutor: BatchExecutor<T>,
    options: StreamProcessingOptions
  ): Promise<StreamLoadResult> {
    const startTime = Date.now();
    const state = this.initializeState(options);

    return new Promise((resolve, reject) => {
      stream
        .pipe(parser.parser)
        .on("data", (row: T) => {
          this.handleDataEvent(
            row,
            state,
            stream,
            batchExecutor,
            options,
            reject
          );
        })
        .on("end", async () => {
          await this.handleEndEvent(
            state,
            batchExecutor,
            startTime,
            resolve,
            reject
          );
        })
        .on("error", (error) => {
          reject(new Error(`Stream error: ${error.message}`));
        });
    });
  }

  /**
   * Initialize processing state
   */
  private initializeState(options: StreamProcessingOptions) {
    return {
      rowNumber: 0,
      successfulBatches: 0,
      failedBatches: 0,
      batchedRows: [] as any[],
      batchQueue: [] as { rows: any[]; batchNumber: number }[],
      isProcessing: false,
      isStreamPaused: false,
      maxQueueSize: options.maxQueueSize ?? 5,
      progressLogInterval: options.progressLogInterval ?? 500,
      errors: [] as LoadError[],
      warnings: [] as LoadWarning[],
    };
  }

  /**
   * Handle incoming data events from the stream
   */
  private handleDataEvent<T>(
    row: T,
    state: any,
    stream: Readable,
    batchExecutor: BatchExecutor<T>,
    options: StreamProcessingOptions,
    reject: (reason?: any) => void
  ): void {
    try {
      state.batchedRows.push(row);
      state.rowNumber++;

      // Log progress at intervals
      if (state.rowNumber % state.progressLogInterval === 0) {
        this.logProgress(state.rowNumber);
      }

      // When batch is full, queue it for processing
      if (state.batchedRows.length >= options.batchSize) {
        const batchNumber = Math.floor(state.rowNumber / options.batchSize) + 1;
        state.batchQueue.push({
          rows: state.batchedRows,
          batchNumber,
        });
        state.batchedRows = []; // Reset for next batch

        // Manage backpressure: pause stream if queue is at capacity
        if (
          state.batchQueue.length >= state.maxQueueSize &&
          !state.isStreamPaused
        ) {
          state.isStreamPaused = true;
          stream.pause();
          console.log(
            `⏸️  Stream paused - queue at capacity (${state.batchQueue.length}/${state.maxQueueSize})`
          );
        }

        // Start processing the queue asynchronously
        setImmediate(() => {
          this.processBatchQueue(state, stream, batchExecutor).catch(
            (error) => {
              console.error("Error in batch processing:", error);
              reject(error);
            }
          );
        });
      }
    } catch (error) {
      reject(
        new Error(`Error processing chunk at row ${state.rowNumber}: ${error}`)
      );
    }
  }

  /**
   * Handle stream end event - process remaining batches
   */
  private async handleEndEvent<T>(
    state: any,
    batchExecutor: BatchExecutor<T>,
    startTime: number,
    resolve: (value: StreamLoadResult) => void,
    reject: (reason?: any) => void
  ): Promise<void> {
    try {
      // Process any remaining rows in the final batch
      if (state.batchedRows.length > 0) {
        const batchNumber =
          Math.floor(state.rowNumber / state.batchedRows.length) + 1;
        state.batchQueue.push({
          rows: state.batchedRows,
          batchNumber,
        });
        state.batchedRows = [];
      }

      // Process any remaining batches in the queue
      await this.processBatchQueue(state, null, batchExecutor);

      // Wait for all queued batches to complete
      while (state.batchQueue.length > 0 || state.isProcessing) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      console.log(
        `📊 Processing complete: ${state.successfulBatches} successful, ${state.failedBatches} failed batches`
      );

      resolve({
        totalRows: state.rowNumber,
        successfulBatches: state.successfulBatches,
        failedBatches: state.failedBatches,
        errors: state.errors,
        warnings: state.warnings,
        durationMs: Date.now() - startTime,
        bytesProcessed: 0,
        rowsPerSecond: state.rowNumber / ((Date.now() - startTime) / 1000),
        memoryUsageMB: process.memoryUsage().heapUsed / 1024 / 1024,
      });
    } catch (error) {
      reject(new Error(`Error processing final buffer: ${error}`));
    }
  }

  /**
   * Process batches from the queue asynchronously
   */
  private async processBatchQueue<T>(
    state: any,
    stream: Readable | null,
    batchExecutor: BatchExecutor<T>
  ): Promise<void> {
    if (state.isProcessing || state.batchQueue.length === 0) return;

    state.isProcessing = true;

    while (state.batchQueue.length > 0) {
      const queueItem = state.batchQueue.shift();
      if (!queueItem) continue;

      try {
        console.log(`📦 Processing batch of ${queueItem.rows.length} rows`);

        const batchResult = await batchExecutor(
          queueItem.rows,
          queueItem.batchNumber
        );

        if (batchResult.success) {
          state.successfulBatches++;
          console.log(`✅ Batch processed successfully`);
        } else {
          state.failedBatches++;
          // Collect errors from batch result
          state.errors.push(...(batchResult.errors || []));
          state.warnings.push(...(batchResult.warnings || []));
        }

        // Resume stream if it was paused and queue has space (only if stream is still active)
        if (
          stream &&
          state.isStreamPaused &&
          state.batchQueue.length < state.maxQueueSize
        ) {
          state.isStreamPaused = false;
          stream.resume();
          console.log(`🔄 Stream resumed - queue has space`);
        }
      } catch (error) {
        console.error(`❌ Batch processing failed:`, error);
        state.failedBatches++;
      }
    }

    state.isProcessing = false;
  }

  /**
   * Log progress with memory information
   */
  private logProgress(rowNumber: number): void {
    const memUsage = process.memoryUsage();
    console.log(
      `📦 Row number: ${rowNumber}, Memory: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`
    );
  }
}
