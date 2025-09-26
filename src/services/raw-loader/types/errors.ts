import type { LoadError, LoadWarning } from "./raw-loader";

/**
 * Error and Exception Types
 */

export interface ErrorSummary {
  totalErrors: number;
  errorsByType: Record<string, number>;
  topErrors: LoadError[];
  retryableErrors: number;
  blockingErrors: number;
  errorsByFile: Record<string, number>;
  errorsByRowRange: { start: number; end: number; count: number }[];
}

export interface RecoveryOptions {
  maxRetries: number;
  retryDelayMs: number;
  continueOnRowError: boolean;
  skipDuplicateFiles: boolean;
  cleanupOnFailure: boolean;
  partialLoadThreshold?: number; // Continue if at least X% successful
}

export enum RecoveryResult {
  SUCCESS = "SUCCESS",
  RETRY = "RETRY",
  SKIP = "SKIP",
  FAIL = "FAIL",
}

export interface RecoveryAttempt {
  attemptNumber: number;
  error: LoadError;
  recoveryAction: RecoveryResult;
  timestamp: Date;
  context?: Record<string, any>;
}

export interface DataQualityReport {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  warnings: LoadWarning[];
  errors: LoadError[];
  qualityScore: number; // 0-100
  recommendations: string[];
  columnStats: Record<string, ColumnQualityStats>;
}

export interface ColumnQualityStats {
  columnName: string;
  dataType: string;
  nullCount: number;
  emptyCount: number;
  distinctCount: number;
  minLength: number;
  maxLength: number;
  averageLength: number;
  formatErrors: number;
  validationErrors: number;
  warnings: string[];
}

export interface ProcessingException extends Error {
  code: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  category: "PARSING" | "VALIDATION" | "DATABASE" | "SYSTEM" | "CONFIGURATION";
  context: {
    fileKey?: string;
    rowNumber?: number;
    columnName?: string;
    operation?: string;
    timestamp: Date;
  };
  retryable: boolean;
  metadata?: Record<string, any>;
}

export interface BatchProcessingError extends ProcessingException {
  batchNumber: number;
  batchSize: number;
  affectedRows: number;
  partialSuccess: boolean;
  rollbackRequired: boolean;
}

export interface FileProcessingError extends ProcessingException {
  fileKey: string;
  fileSize: number;
  extractType: string;
  rowsProcessed: number;
  totalRows: number;
  processingProgress: number; // 0-1
}

export interface ConfigurationError extends ProcessingException {
  configSection: string;
  configKey: string;
  providedValue: any;
  expectedType: string;
  validValues?: any[];
}

export interface ResourceExhaustionError extends ProcessingException {
  resourceType: "MEMORY" | "CONNECTIONS" | "FILE_HANDLES" | "DISK_SPACE";
  currentUsage: number;
  limit: number;
  available: number;
  suggestions: string[];
}

// Error factory functions
export class ErrorFactory {
  static createProcessingException(
    message: string,
    code: string,
    severity: ProcessingException["severity"],
    category: ProcessingException["category"],
    context: ProcessingException["context"],
    retryable = false,
    metadata?: Record<string, any>
  ): ProcessingException {
    const error = new Error(message) as ProcessingException;
    error.code = code;
    error.severity = severity;
    error.category = category;
    error.context = context;
    error.retryable = retryable;
    error.metadata = metadata;
    return error;
  }

  static createBatchProcessingError(
    message: string,
    batchNumber: number,
    batchSize: number,
    affectedRows: number,
    partialSuccess: boolean,
    rollbackRequired: boolean,
    context: ProcessingException["context"],
    retryable = false
  ): BatchProcessingError {
    const error = this.createProcessingException(
      message,
      "BATCH_PROCESSING_ERROR",
      "HIGH",
      "DATABASE",
      context,
      retryable
    ) as BatchProcessingError;

    error.batchNumber = batchNumber;
    error.batchSize = batchSize;
    error.affectedRows = affectedRows;
    error.partialSuccess = partialSuccess;
    error.rollbackRequired = rollbackRequired;
    return error;
  }

  static createFileProcessingError(
    message: string,
    fileKey: string,
    fileSize: number,
    extractType: string,
    rowsProcessed: number,
    totalRows: number,
    processingProgress: number,
    context: ProcessingException["context"],
    retryable = false
  ): FileProcessingError {
    const error = this.createProcessingException(
      message,
      "FILE_PROCESSING_ERROR",
      "HIGH",
      "PARSING",
      context,
      retryable
    ) as FileProcessingError;

    error.fileKey = fileKey;
    error.fileSize = fileSize;
    error.extractType = extractType;
    error.rowsProcessed = rowsProcessed;
    error.totalRows = totalRows;
    error.processingProgress = processingProgress;
    return error;
  }

  static createConfigurationError(
    message: string,
    configSection: string,
    configKey: string,
    providedValue: any,
    expectedType: string,
    validValues?: any[]
  ): ConfigurationError {
    const error = this.createProcessingException(
      message,
      "CONFIGURATION_ERROR",
      "HIGH",
      "CONFIGURATION",
      {
        timestamp: new Date(),
        operation: "configuration_validation",
      },
      false
    ) as ConfigurationError;

    error.configSection = configSection;
    error.configKey = configKey;
    error.providedValue = providedValue;
    error.expectedType = expectedType;
    error.validValues = validValues;
    return error;
  }

  static createResourceExhaustionError(
    resourceType: ResourceExhaustionError["resourceType"],
    currentUsage: number,
    limit: number,
    available: number,
    suggestions: string[]
  ): ResourceExhaustionError {
    const error = this.createProcessingException(
      `Resource exhaustion: ${resourceType} usage (${currentUsage}) exceeds limit (${limit})`,
      "RESOURCE_EXHAUSTION",
      "CRITICAL",
      "SYSTEM",
      {
        timestamp: new Date(),
        operation: "resource_check",
      },
      true
    ) as ResourceExhaustionError;

    error.resourceType = resourceType;
    error.currentUsage = currentUsage;
    error.limit = limit;
    error.available = available;
    error.suggestions = suggestions;
    return error;
  }
}
