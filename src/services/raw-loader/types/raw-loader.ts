import type { CSVRow } from "./csv";
import type { LoadError, LoadWarning, LoadErrorType } from "../../shared/types";

/**
 * Raw Loader Service Types
 * Layer-specific types that extend shared types
 */

export interface RawLoadOptions {
  extractType: string;
  loadRunId: string; // Load run ID for tracking
  loadRunFileId?: number; // Foreign key to etl.load_run_files for lineage data
  batchSize?: number; // Rows per batch insert
  maxRetries?: number; // Retry attempts for failed batches
  continueOnError?: boolean; // Continue processing other batches on error
  validateRowCount?: boolean; // Validate expected vs actual row counts
  skipValidation?: boolean; // Skip row validation for performance
  maxConcurrentFiles?: number; // Maximum concurrent file processing
  fieldSeparator?: string; // CSV field separator
  rowSeparator?: string; // CSV row separator
}

export interface LoadResult {
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

// Re-export shared types for convenience
export type { LoadError, LoadWarning, LoadErrorType };

export enum LoadStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  PARTIAL = "partial",
  RETRYING = "retrying",
}

export interface LoadProgress {
  fileKey: string;
  extractType: string;
  totalRows: number;
  processedRows: number;
  currentBatch: number;
  totalBatches: number;
  estimatedTimeRemaining: number;
  currentStatus: LoadStatus;
  errors: LoadError[];
  warnings: LoadWarning[];
  bytesProcessed: number;
  memoryUsageMB: number;
  startTime: Date;
  lastUpdate: Date;
}

// Re-export shared batch types for convenience
export type { InsertBatch, BatchResult } from "../../shared/types";

export interface RawTableRow {
  [columnName: string]: any;
  // Lineage columns
  s3_bucket: string;
  s3_key: string;
  s3_version_id: string;
  file_hash: string;
  date_extracted: string;
  extract_type: string;
  load_run_id: string;
  load_ts: Date;
  rowNumber?: number;
  rawText?: string;
}

export interface IdempotencyCheck {
  s3Key: string;
  s3VersionId: string;
  fileHash: string;
  extractType: string;
  isProcessed: boolean;
  loadRunId?: string;
  loadRunFileId?: number; // Added for foreign key relationship to etl.load_run_files
  processedAt?: Date;
  rowCount?: number;
  lastError?: string;
}

export interface LoadState {
  fileKey: string;
  processedRows: number;
  totalRows: number;
  lastProcessedRow: number;
  isCompleted: boolean;
  errorCount: number;
  loadRunId: string;
  checkpointData?: any;
  resumeToken?: string;
}

export interface LineageData {
  s3Bucket: string;
  s3Key: string;
  s3VersionId: string;
  fileHash: string;
  dateExtracted: string;
  extractType: string;
  loadRunId: string;
  loadTs: Date;
  rowCount?: number;
}

export interface ExtractHandler {
  extractType: string;
  tableName: string;
  columnMapping: string[];
  validationRules: ValidationRule[];
  preProcess?: (row: CSVRow) => CSVRow | Promise<CSVRow>;
  postProcess?: (row: RawTableRow) => RawTableRow | Promise<RawTableRow>;
  transformRow?: (row: CSVRow) => RawTableRow | Promise<RawTableRow>;
}

export interface ValidationRule {
  columnName: string;
  ruleType: "required" | "format" | "range" | "enum" | "custom";
  validator: (value: string) => boolean;
  errorMessage: string;
  severity?: "error" | "warning";
}

export interface PerformanceConfig {
  maxBatchSize: number;
  maxConcurrentFiles: number;
  maxMemoryUsageMB: number;
  enableStreaming: boolean;
  enableCompression: boolean;
  connectionPoolSize: number;
  enableParallelProcessing: boolean;
}

export interface LoadMetrics {
  filesProcessed: number;
  totalRowsLoaded: number;
  totalBytesProcessed: number;
  averageRowsPerSecond: number;
  averageProcessingTimeMs: number;
  errorRate: number;
  retryCount: number;
  memoryPeakUsageMB: number;
  databaseConnectionsUsed: number;
  throughputMBps: number;
  averageLatencyMs: number;
}
