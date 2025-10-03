import type { CSVRow } from "./csv";
import type {
  LoadError,
  LoadWarning,
  LoadErrorType,
  InsertBatch,
} from "../../../shared/types";
import type { FileBatch } from "../../discovery/types/files";
import type { ProcessingPlan } from "../../discovery/types/discovery";

/**
 * Raw Loader Service Types
 * Layer-specific types that extend shared types for the raw data loading pipeline
 */

/**
 * Configuration options for raw data loading operations
 * Controls batch processing, validation, and error handling behavior
 */
export interface RawLoadOptions {
  /** Type of data extract being processed (e.g., 'patients', 'appointments') */
  extractType: string;
  /** Unique identifier for this load run session */
  loadRunId: string;
  /** Foreign key to etl.load_run_files table for audit trail */
  loadRunFileId?: number;
  /** Number of rows to process in each batch (default: 1000) */
  batchSize?: number;
  /** Maximum retry attempts for failed batches (default: 3) */
  maxRetries?: number;
  /** Whether to continue processing other batches when one fails (default: true) */
  continueOnError?: boolean;
  /** Whether to validate expected vs actual row counts (default: true) */
  validateRowCount?: boolean;
  /** Skip row-level validation for performance optimization (default: false) */
  skipValidation?: boolean;
  /** Maximum number of files to process concurrently (default: 5) */
  maxConcurrentFiles?: number;
  /** CSV field delimiter character (default: ',') */
  fieldSeparator?: string;
  /** CSV row delimiter character (default: '\n') */
  rowSeparator?: string;
}

/**
 * Result summary for a completed load operation
 * Contains metrics, performance data, and error/warning information
 */
export interface LoadResult {
  /** Total number of rows processed across all batches */
  totalRows: number;
  /** Number of batches that completed successfully */
  successfulBatches: number;
  /** Number of batches that failed after all retry attempts */
  failedBatches: number;
  /** Collection of errors encountered during processing */
  errors: LoadError[];
  /** Collection of warnings generated during processing */
  warnings: LoadWarning[];
  /** Total processing time in milliseconds */
  durationMs: number;
  /** Total bytes of data processed from source files */
  bytesProcessed: number;
  /** Processing throughput in rows per second */
  rowsPerSecond: number;
  /** Peak memory usage during processing in megabytes */
  memoryUsageMB: number;
}

/**
 * Status values for load operations
 * Tracks the current state of file processing within a load run
 */
export enum LoadStatus {
  /** Load operation is queued but not yet started */
  PENDING = "pending",
  /** Load operation is currently in progress */
  PROCESSING = "processing",
  /** Load operation completed successfully */
  COMPLETED = "completed",
  /** Load operation failed and will not be retried */
  FAILED = "failed",
  /** Load operation completed with some errors but partial success */
  PARTIAL = "partial",
  /** Load operation is retrying after a previous failure */
  RETRYING = "retrying",
}

/**
 * Real-time progress tracking for individual file load operations
 * Used for monitoring and reporting load progress to external systems
 */
export interface LoadProgress {
  /** S3 key or file path being processed */
  fileKey: string;
  /** Type of data extract being processed */
  extractType: string;
  /** Total number of rows in the file */
  totalRows: number;
  /** Number of rows processed so far */
  processedRows: number;
  /** Current batch number being processed (1-based) */
  currentBatch: number;
  /** Total number of batches for this file */
  totalBatches: number;
  /** Estimated time remaining in milliseconds */
  estimatedTimeRemaining: number;
  /** Current status of the load operation */
  currentStatus: LoadStatus;
  /** Errors encountered during processing */
  errors: LoadError[];
  /** Warnings generated during processing */
  warnings: LoadWarning[];
  /** Total bytes processed from this file */
  bytesProcessed: number;
  /** Current memory usage in megabytes */
  memoryUsageMB: number;
  /** When the load operation started */
  startTime: Date;
  /** When this progress update was generated */
  lastUpdate: Date;
}

// Re-export shared types for convenience
export type { LoadError, LoadWarning, LoadErrorType, InsertBatch };

/**
 * Structure for raw table rows with mandatory lineage metadata
 * All raw data rows must include these lineage columns for audit and traceability
 */
export interface RawTableRow {
  /** Dynamic column mapping for actual data fields */
  [columnName: string]: any;

  // Lineage columns - required for all raw table rows
  /** S3 bucket where the source file is stored */
  s3_bucket: string;
  /** S3 key (file path) of the source file */
  s3_key: string;
  /** S3 version ID for immutable file references */
  s3_version_id: string;
  /** SHA-256 hash of the source file for integrity verification */
  file_hash: string;
  /** ISO date string when the file was extracted from source system */
  date_extracted: string;
  /** Type of data extract (e.g., 'patients', 'appointments') */
  extract_type: string;
  /** Unique identifier for this load run session */
  load_run_id: string;
  /** Timestamp when this row was loaded into the database */
  load_ts: Date;
  /** Optional row number within the source file (1-based) */
  rowNumber?: number;
  /** Optional raw text content for debugging and error analysis */
  rawText?: string;
}

/**
 * Idempotency check result for preventing duplicate file processing
 * Ensures files are not processed multiple times across different load runs
 */
export interface IdempotencyCheck {
  /** S3 key (file path) being checked */
  s3Key: string;
  /** S3 version ID for immutable file references */
  s3VersionId: string;
  /** SHA-256 hash of the file content */
  fileHash: string;
  /** Type of data extract */
  extractType: string;
  /** Whether this file has already been processed successfully */
  isProcessed: boolean;
  /** Load run ID that processed this file (if processed) */
  loadRunId?: string;
  /** Foreign key to etl.load_run_files table for audit trail */
  loadRunFileId?: number;
  /** Timestamp when the file was last processed */
  processedAt?: Date;
  /** Number of rows processed from this file */
  rowCount?: number;
  /** Last error message if processing failed */
  lastError?: string;
}

/**
 * State tracking for resumable file processing
 * Enables checkpointing and resuming of large file loads
 */
export interface LoadState {
  /** S3 key or file path being processed */
  fileKey: string;
  /** Number of rows processed so far */
  processedRows: number;
  /** Total number of rows in the file */
  totalRows: number;
  /** Last row number that was successfully processed (1-based) */
  lastProcessedRow: number;
  /** Whether the file processing is complete */
  isCompleted: boolean;
  /** Number of errors encountered during processing */
  errorCount: number;
  /** Load run ID for this processing session */
  loadRunId: string;
  /** Optional checkpoint data for resuming processing */
  checkpointData?: any;
  /** Optional resume token for distributed processing coordination */
  resumeToken?: string;
}

/**
 * Data lineage information for audit and traceability
 * Tracks the source and processing metadata for data rows
 */
export interface LineageData {
  /** S3 bucket where the source file is stored */
  s3Bucket: string;
  /** S3 key (file path) of the source file */
  s3Key: string;
  /** S3 version ID for immutable file references */
  s3VersionId: string;
  /** SHA-256 hash of the source file for integrity verification */
  fileHash: string;
  /** ISO date string when the file was extracted from source system */
  dateExtracted: string;
  /** Type of data extract (e.g., 'patients', 'appointments') */
  extractType: string;
  /** Unique identifier for this load run session */
  loadRunId: string;
  /** Timestamp when this data was loaded into the database */
  loadTs: Date;
  /** Optional count of rows processed from this file */
  rowCount?: number;
}

/**
 * Handler configuration for processing specific extract types
 * Defines how CSV data is transformed and validated for each data type
 */
export interface ExtractHandler {
  /** Type of data extract this handler processes */
  extractType: string;
  /** Target raw table name for storing processed data */
  tableName: string;
  /** Ordered list of column names for CSV parsing */
  columnMapping: string[];
  /** Validation rules to apply to each row */
  validationRules: ValidationRule[];
  /** Optional preprocessing function for CSV rows before validation */
  preProcess?: (row: CSVRow) => CSVRow | Promise<CSVRow>;
  /** Optional postprocessing function for raw table rows after transformation */
  postProcess?: (row: RawTableRow) => RawTableRow | Promise<RawTableRow>;
  /** Optional custom row transformation function (overrides default) */
  transformRow?: (row: CSVRow) => RawTableRow | Promise<RawTableRow>;
}

/**
 * Validation rule definition for data quality checks
 * Defines how individual column values are validated during processing
 */
export interface ValidationRule {
  /** Name of the column to validate */
  columnName: string;
  /** Type of validation rule to apply */
  ruleType: "required" | "format" | "range" | "enum" | "custom";
  /** Function that returns true if the value is valid */
  validator: (value: string) => boolean;
  /** Error message to display when validation fails */
  errorMessage: string;
  /** Severity level - errors stop processing, warnings allow continuation */
  severity?: "error" | "warning";
}

/**
 * Performance tuning configuration for load operations
 * Controls resource usage and processing optimization settings
 */
export interface PerformanceConfig {
  /** Maximum number of rows to process in a single batch */
  maxBatchSize: number;
  /** Maximum number of files to process concurrently */
  maxConcurrentFiles: number;
  /** Maximum memory usage before triggering garbage collection (MB) */
  maxMemoryUsageMB: number;
  /** Whether to use streaming for large file processing */
  enableStreaming: boolean;
  /** Whether to enable compression for data transfer */
  enableCompression: boolean;
  /** Size of the database connection pool */
  connectionPoolSize: number;
  /** Whether to enable parallel processing within batches */
  enableParallelProcessing: boolean;
}

/**
 * Performance metrics collected during load operations
 * Used for monitoring, alerting, and performance optimization
 */
export interface LoadMetrics {
  /** Total number of files processed in this load run */
  filesProcessed: number;
  /** Total number of rows successfully loaded */
  totalRowsLoaded: number;
  /** Total bytes of data processed from source files */
  totalBytesProcessed: number;
  /** Average processing throughput in rows per second */
  averageRowsPerSecond: number;
  /** Average time to process each file in milliseconds */
  averageProcessingTimeMs: number;
  /** Percentage of rows that failed validation or processing */
  errorRate: number;
  /** Total number of retry attempts across all operations */
  retryCount: number;
  /** Peak memory usage during the load operation (MB) */
  memoryPeakUsageMB: number;
  /** Number of database connections used concurrently */
  databaseConnectionsUsed: number;
  /** Data throughput in megabytes per second */
  throughputMBps: number;
  /** Average database operation latency in milliseconds */
  averageLatencyMs: number;
}

/**
 * Possible status values for load run operations
 * Tracks the overall state of a complete load run session
 */
export type LoadRunStatus = "running" | "completed" | "failed" | "cancelled";

/**
 * Source that triggered the load run operation
 * Used for audit and operational tracking
 */
export type LoadRunTrigger = "scheduled" | "manual" | "backfill";

/**
 * Parameters for creating a new load run
 * Used when initiating a new data loading session
 */
export interface CreateLoadRunParams {
  /** Source that triggered this load run */
  triggeredBy: LoadRunTrigger;
  /** Optional notes or description for this load run */
  notes?: string;
}

/**
 * Parameters for updating an existing load run
 * Used to track progress and final results
 */
export interface UpdateLoadRunParams {
  /** Current status of the load run */
  status?: LoadRunStatus;
  /** Timestamp when the load run completed */
  completedAt?: Date;
  /** Total number of files processed in this run */
  totalFilesProcessed?: number;
  /** Total number of rows successfully ingested */
  totalRowsIngested?: number;
  /** Total number of rows rejected due to validation errors */
  totalRowsRejected?: number;
  /** Optional notes or description updates */
  notes?: string;
}

/**
 * Complete load run record from the database
 * Represents a persisted load run with all metadata
 */
export interface LoadRunRecord {
  /** Unique identifier for this load run */
  loadRunId: string;
  /** Timestamp when the load run started */
  startedAt: Date;
  /** Timestamp when the load run completed (null if still running) */
  completedAt: Date | null;
  /** Current status of the load run */
  status: string;
  /** Source that triggered this load run */
  triggeredBy: string;
  /** Notes or description for this load run */
  notes: string | null;
  /** Total number of files processed */
  totalFilesProcessed: number;
  /** Total number of rows successfully ingested */
  totalRowsIngested: number;
  /** Total number of rows rejected due to validation errors */
  totalRowsRejected: number;
  /** Timestamp when this record was created */
  createdAt: Date;
  /** Timestamp when this record was last updated */
  updatedAt: Date;
}

/**
 * Result for a single batch within a processing plan
 * Contains aggregated results for all files in a batch
 */
export interface ProcessingBatchResult {
  /** Index of this batch within the processing plan (0-based) */
  batchIndex: number;
  /** Unique identifier for this batch */
  batchId: string;
  /** Individual file load results for this batch */
  fileResults: LoadResult[];
  /** Total number of files in this batch */
  totalFiles: number;
  /** Total number of rows processed across all files in this batch */
  totalRows: number;
  /** Number of successful file loads in this batch */
  successfulFiles: number;
  /** Number of failed file loads in this batch */
  failedFiles: number;
  /** Total processing time for this batch in milliseconds */
  durationMs: number;
  /** Errors aggregated from all files in this batch */
  errors: LoadError[];
  /** Warnings aggregated from all files in this batch */
  warnings: LoadWarning[];
}

/**
 * Result for a complete processing plan execution
 * Contains aggregated results for all batches in the plan
 */
export interface ProcessingPlanResult {
  /** Total number of batches in the processing plan */
  totalBatches: number;
  /** Number of batches that were successfully processed */
  batchesProcessed: number;
  /** Number of batches that failed during processing */
  batchesFailed: number;
  /** Total number of files across all batches */
  totalFiles: number;
  /** Total number of rows processed across all files and batches */
  totalRows: number;
  /** Number of files that were successfully processed */
  successfulFiles: number;
  /** Number of files that failed during processing */
  failedFiles: number;
  /** Individual batch results */
  batchResults: ProcessingBatchResult[];
  /** Total processing time for the entire plan in milliseconds */
  overallDuration: number;
  /** All errors aggregated from all batches */
  errors: LoadError[];
  /** All warnings aggregated from all batches */
  warnings: LoadWarning[];
  /** Timestamp when processing started */
  startedAt: Date;
  /** Timestamp when processing completed */
  completedAt: Date;
}
