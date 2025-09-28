import type { CSVRow } from "./csv";

/**
 * Raw Loader Service Types
 */

export interface RawLoadOptions {
  extractType: string;
  loadRunId: string; // Load run ID for tracking
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

export interface LoadError {
  errorType: LoadErrorType;
  message: string;
  fileKey?: string;
  rowNumber?: number;
  columnName?: string;
  rawRow?: string;
  timestamp: Date;
  isRetryable: boolean;
  context?: Record<string, any>;
}

export interface LoadWarning {
  message: string;
  fileKey?: string;
  rowNumber?: number;
  columnName?: string;
  rawRow?: string;
  timestamp: Date;
  severity: "low" | "medium" | "high";
}

export enum LoadErrorType {
  CSV_PARSE_ERROR = "CSV_PARSE_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  IDEMPOTENCY_ERROR = "IDEMPOTENCY_ERROR",
  FILE_NOT_FOUND = "FILE_NOT_FOUND",
  PERMISSION_ERROR = "PERMISSION_ERROR",
  CONSTRAINT_VIOLATION = "CONSTRAINT_VIOLATION",
  MEMORY_ERROR = "MEMORY_ERROR",
  TIMEOUT_ERROR = "TIMEOUT_ERROR",
}

export enum LoadStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  PARTIAL = "PARTIAL",
  RETRYING = "RETRYING",
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

export interface InsertBatch {
  tableName: string;
  columns: string[];
  values: any[][];
  rowCount: number;
  batchNumber: number;
  fileKey: string;
  loadRunId: string;
}

export interface BatchResult {
  batchNumber: number;
  rowsInserted: number;
  errors: LoadError[];
  warnings: LoadWarning[];
  durationMs: number;
  success: boolean;
}

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
