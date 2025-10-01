/**
 * Shared types for generic ETL loading operations
 * These types are used across raw, staging, and core loaders
 */

/**
 * Generic batch for database insertion
 */
export interface InsertBatch {
  tableName: string;
  columns: string[];
  values: any[][];
  rowCount: number;
  batchNumber: number;
  fileKey?: string;
  loadRunId?: string;
}

/**
 * Result of a single batch operation
 */
export interface BatchResult {
  batchNumber: number;
  rowsInserted: number;
  errors: LoadError[];
  warnings: LoadWarning[];
  durationMs: number;
  success: boolean;
}

/**
 * Load error information
 */
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

/**
 * Load warning information
 */
export interface LoadWarning {
  message: string;
  fileKey?: string;
  rowNumber?: number;
  columnName?: string;
  rawRow?: string;
  timestamp: Date;
  severity: "low" | "medium" | "high";
}

/**
 * Error types for ETL operations
 */
export enum LoadErrorType {
  CSV_PARSE_ERROR = "csv_parse_error",
  VALIDATION_ERROR = "validation_error",
  DATABASE_ERROR = "database_error",
  IDEMPOTENCY_ERROR = "idempotency_error",
  FILE_NOT_FOUND = "file_not_found",
  PERMISSION_ERROR = "permission_error",
  CONSTRAINT_VIOLATION = "constraint_violation",
  MEMORY_ERROR = "memory_error",
  TIMEOUT_ERROR = "timeout_error",
  TRANSFORMATION_ERROR = "transformation_error",
  SCD2_ERROR = "scd2_error",
}

/**
 * Options for batch loading operations
 */
export interface BatchLoadOptions {
  batchSize?: number;
  maxRetries?: number;
  continueOnError?: boolean;
  validateRowCount?: boolean;
  skipValidation?: boolean;
  loadRunId?: string;
  [key: string]: any; // Allow for layer-specific options
}
