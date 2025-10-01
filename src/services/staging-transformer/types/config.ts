/**
 * Staging Transformer Configuration Types
 */

import type { DatabaseConfig } from "../../raw-loader/types/config";

/**
 * Configuration for staging transformation operations
 */
export interface StagingTransformerConfig {
  database: DatabaseConfig;
  transformation: TransformationConfig;
  validation: ValidationConfig;
  errorHandling: ErrorHandlingConfig;
  monitoring: MonitoringConfig;
}

/**
 * Transformation-specific configuration
 */
export interface TransformationConfig {
  batchSize: number; // Rows per batch read from raw tables
  maxConcurrentTransforms: number; // Parallel transformation operations
  enableTypeCoercion: boolean; // Automatically coerce compatible types
  dateFormat: string; // Default date format for parsing
  timestampFormat: string; // Default timestamp format
  decimalPrecision: number; // Default decimal precision
  trimStrings: boolean; // Trim whitespace from text fields
  nullifyEmptyStrings: boolean; // Convert empty strings to NULL
}

/**
 * Validation configuration
 */
export interface ValidationConfig {
  enableValidation: boolean; // Enable/disable validation
  failOnValidationError: boolean; // Fail entire batch on validation error
  maxErrorsPerBatch: number; // Max validation errors before stopping batch
  maxTotalErrors: number; // Max total errors before stopping entire load
  rejectInvalidRows: boolean; // Send invalid rows to rejection tables
  trackRejectionReasons: boolean; // Store detailed rejection reasons
}

/**
 * Error handling configuration
 */
export interface ErrorHandlingConfig {
  continueOnError: boolean; // Continue processing on non-fatal errors
  maxRetries: number; // Retry attempts for transient errors
  retryDelayMs: number; // Delay between retries
  captureRawRow: boolean; // Include raw row data in error logs
  enableDetailedLogging: boolean; // Detailed error logging
}

/**
 * Monitoring configuration
 */
export interface MonitoringConfig {
  enableProgressTracking: boolean; // Track transformation progress
  progressUpdateIntervalMs: number; // Progress update frequency
  enableMetrics: boolean; // Collect performance metrics
  logSlowTransformations: boolean; // Log transformations exceeding threshold
  slowTransformationThresholdMs: number; // Threshold for slow transformation
}

/**
 * Default staging transformer configuration
 */
export const defaultStagingTransformerConfig: StagingTransformerConfig = {
  database: {
    poolSize: 20,
    maxConnections: 20,
    timeoutMs: 30000,
  },
  transformation: {
    batchSize: 1000,
    maxConcurrentTransforms: 3,
    enableTypeCoercion: true,
    dateFormat: "YYYY-MM-DD",
    timestampFormat: "YYYY-MM-DD HH:mm:ss",
    decimalPrecision: 2,
    trimStrings: true,
    nullifyEmptyStrings: true,
  },
  validation: {
    enableValidation: true,
    failOnValidationError: false,
    maxErrorsPerBatch: 100,
    maxTotalErrors: 1000,
    rejectInvalidRows: true,
    trackRejectionReasons: true,
  },
  errorHandling: {
    continueOnError: true,
    maxRetries: 3,
    retryDelayMs: 1000,
    captureRawRow: true,
    enableDetailedLogging: true,
  },
  monitoring: {
    enableProgressTracking: true,
    progressUpdateIntervalMs: 5000,
    enableMetrics: true,
    logSlowTransformations: true,
    slowTransformationThresholdMs: 10000,
  },
};
