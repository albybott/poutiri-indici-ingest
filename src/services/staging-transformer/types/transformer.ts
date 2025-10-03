/**
 * Staging Transformer Core Types
 */

import type { LoadError, LoadWarning } from "@/shared/types";

/**
 * Options for staging transformation operations
 */
export interface StagingTransformOptions {
  extractType: string; // Extract type to transform (e.g., "Patient")
  loadRunId: string; // Load run identifier
  sourceTable: string; // Raw table name (e.g., "raw.patients")
  targetTable: string; // Staging table name (e.g., "stg.patients")
  batchSize?: number; // Override default batch size
  skipValidation?: boolean; // Skip validation for performance
  upsertMode?: boolean; // Use upsert instead of insert
  conflictColumns?: string[]; // Columns for conflict resolution
  forceReprocess?: boolean; // Skip idempotency check and force reprocessing
}

/**
 * Result of staging transformation operation
 */
export interface TransformResult {
  totalRowsRead: number; // Rows read from raw table
  totalRowsTransformed: number; // Rows successfully transformed
  totalRowsRejected: number; // Rows rejected due to validation
  totalRowsDeduplicated?: number; // Rows removed due to deduplication
  successfulBatches: number; // Number of successful batches
  failedBatches: number; // Number of failed batches
  errors: LoadError[]; // Errors encountered
  warnings: LoadWarning[]; // Warnings generated
  rejections: RejectedRow[]; // Details of rejected rows
  durationMs: number; // Total duration
  rowsPerSecond: number; // Throughput
  memoryUsageMB: number; // Peak memory usage
}

/**
 * Rejected row information
 */
export interface RejectedRow {
  rowNumber: number; // Row number from source
  sourceRowId?: string; // Identifier from source (if available)
  rejectionReason: string; // Why row was rejected
  failedValidations: ValidationFailure[]; // Specific validation failures
  rawData?: Record<string, any>; // Original raw data (if captured)
  timestamp: Date; // When rejection occurred
}

/**
 * Validation failure details
 */
export interface ValidationFailure {
  columnName: string; // Column that failed validation
  rule: string; // Validation rule that failed
  actualValue: any; // Actual value
  expectedType?: string; // Expected type (if type validation)
  errorMessage: string; // Human-readable error message
}

/**
 * Column transformation rule
 */
export interface ColumnTransformation {
  sourceColumn: string; // Column name in raw table
  targetColumn: string; // Column name in staging table
  targetType: ColumnType; // Target data type
  required: boolean; // Is this column required (NOT NULL)
  defaultValue?: any; // Default value if NULL or invalid
  transformFunction?: TransformFunction; // Custom transformation
  validationRules?: ValidationRule[]; // Validation rules
}

/**
 * Supported column types for transformation
 */
export enum ColumnType {
  TEXT = "text",
  INTEGER = "integer",
  DECIMAL = "decimal",
  BOOLEAN = "boolean",
  DATE = "date",
  TIMESTAMP = "timestamp",
  UUID = "uuid",
  JSON = "json",
}

/**
 * Custom transformation function type
 */
export type TransformFunction = (
  value: any,
  row: Record<string, any>
) => any | Promise<any>;

/**
 * Validation rule definition
 */
export interface ValidationRule {
  name: string; // Rule name (e.g., "nhi_format")
  type: ValidationType; // Type of validation
  validator: (value: any, row?: Record<string, any>) => boolean; // Validation logic
  errorMessage: string; // Error message if validation fails
  severity: "error" | "warning"; // Severity level
}

/**
 * Types of validation
 */
export enum ValidationType {
  REQUIRED = "required", // Field must not be null/empty
  FORMAT = "format", // Field must match pattern
  RANGE = "range", // Field must be within range
  ENUM = "enum", // Field must be one of allowed values
  LENGTH = "length", // String length constraints
  REFERENCE = "reference", // Foreign key reference validation
  CUSTOM = "custom", // Custom validation logic
}

/**
 * Extract handler configuration for staging
 */
export interface StagingExtractHandler {
  extractType: string; // Extract type (e.g., "Patient")
  sourceTable: string; // Raw table name
  targetTable: string; // Staging table name
  transformations: ColumnTransformation[]; // Column transformations
  naturalKeys: string[]; // Natural key columns for upsert
  uniqueConstraints?: string[][]; // Unique constraint column groups
}

/**
 * Progress tracking for staging transformation
 */
export interface TransformProgress {
  extractType: string;
  sourceTable: string;
  targetTable: string;
  totalRows: number;
  processedRows: number;
  transformedRows: number;
  rejectedRows: number;
  currentBatch: number;
  totalBatches: number;
  estimatedTimeRemaining: number;
  currentStatus: TransformStatus;
  errors: LoadError[];
  warnings: LoadWarning[];
  startTime: Date;
  lastUpdate: Date;
}

/**
 * Status of transformation operation
 */
export enum TransformStatus {
  PENDING = "pending",
  READING = "reading",
  TRANSFORMING = "transforming",
  VALIDATING = "validating",
  LOADING = "loading",
  COMPLETED = "completed",
  FAILED = "failed",
  PARTIAL = "partial",
}

/**
 * Metrics for staging transformation
 */
export interface TransformMetrics {
  extractType: string;
  totalRowsTransformed: number;
  totalRowsRejected: number;
  averageTransformTimeMs: number;
  averageValidationTimeMs: number;
  averageBatchSizeRows: number;
  throughputRowsPerSecond: number;
  errorRate: number;
  rejectionRate: number;
  memoryPeakUsageMB: number;
}

/**
 * Status values for staging run operations
 */
export type StagingRunStatus = "running" | "completed" | "failed";

/**
 * Parameters for creating a new staging run
 */
export interface CreateStagingRunParams {
  /** Load run ID that this staging transformation is processing */
  loadRunId: string;
  /** Extract type being transformed */
  extractType: string;
  /** Source raw table name */
  sourceTable: string;
  /** Target staging table name */
  targetTable: string;
}

/**
 * Parameters for updating an existing staging run
 */
export interface UpdateStagingRunParams {
  /** Current status of the staging run */
  status?: StagingRunStatus;
  /** Timestamp when the staging run completed */
  completedAt?: Date;
  /** Total number of rows read from source */
  totalRowsRead?: number;
  /** Total number of rows successfully transformed */
  totalRowsTransformed?: number;
  /** Total number of rows rejected due to validation */
  totalRowsRejected?: number;
  /** Total number of rows removed due to deduplication */
  totalRowsDeduplicated?: number;
  /** Number of batches that completed successfully */
  successfulBatches?: number;
  /** Number of batches that failed */
  failedBatches?: number;
  /** Total processing duration in milliseconds */
  durationMs?: number;
  /** Processing throughput in rows per second */
  rowsPerSecond?: number;
  /** Peak memory usage during processing (MB) */
  memoryUsageMB?: number;
  /** Error message if the staging run failed */
  error?: string;
  /** JSON string of full result */
  result?: string;
}

/**
 * Complete staging run record from the database
 */
export interface StagingRunRecord {
  /** Unique identifier for this staging run */
  stagingRunId: string;
  /** Load run ID that this staging transformation is processing */
  loadRunId: string;
  /** Extract type being transformed */
  extractType: string;
  /** Source raw table name */
  sourceTable: string;
  /** Target staging table name */
  targetTable: string;
  /** Timestamp when the staging run started */
  startedAt: Date;
  /** Timestamp when the staging run completed (null if still running) */
  completedAt: Date | null;
  /** Current status of the staging run */
  status: string;
  /** Total number of rows read from source */
  totalRowsRead: number;
  /** Total number of rows successfully transformed */
  totalRowsTransformed: number;
  /** Total number of rows rejected due to validation */
  totalRowsRejected: number;
  /** Total number of rows removed due to deduplication */
  totalRowsDeduplicated: number;
  /** Number of batches that completed successfully */
  successfulBatches: number;
  /** Number of batches that failed */
  failedBatches: number;
  /** Total processing duration in milliseconds */
  durationMs: number | null;
  /** Processing throughput in rows per second */
  rowsPerSecond: number | null;
  /** Peak memory usage during processing (MB) */
  memoryUsageMB: number | null;
  /** Error message if the staging run failed */
  error: string | null;
  /** JSON string of full result */
  result: string | null;
  /** Timestamp when this record was created */
  createdAt: Date;
  /** Timestamp when this record was last updated */
  updatedAt: Date;
}
