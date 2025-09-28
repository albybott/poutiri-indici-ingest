/**
 * Raw Loader Configuration Types
 */

export interface RawLoaderConfig {
  database: DatabaseConfig;
  processing: ProcessingConfig;
  csv: CSVConfig;
  errorHandling: ErrorHandlingConfig;
  monitoring: MonitoringConfig;
}

export interface DatabaseConfig {
  poolSize: number;
  timeoutMs: number;
  maxConnections: number;
  retryAttempts?: number;
  retryDelayMs?: number;
}

export interface ProcessingConfig {
  batchSize: number;
  maxConcurrentFiles: number;
  maxMemoryMB: number;
  enableStreaming: boolean;
  bufferSizeMB: number;
  continueOnError?: boolean;
}

export interface CSVConfig {
  fieldSeparator: string;
  rowSeparator: string;
  maxRowLength: number;
  hasHeaders: boolean;
  skipEmptyRows?: boolean;
}

export interface ErrorHandlingConfig {
  maxRetries: number;
  retryDelayMs: number;
  continueOnError: boolean;
  logErrors?: boolean;
  errorThreshold?: number; // Stop processing if error rate exceeds threshold
}

export interface MonitoringConfig {
  enableMetrics: boolean;
  logLevel: string;
  metricsInterval: number;
  enableProgressTracking?: boolean;
  progressUpdateInterval?: number;
}

// Default configuration constants
export const DEFAULT_RAW_LOADER_CONFIG: RawLoaderConfig = {
  database: {
    poolSize: 10,
    timeoutMs: 30000,
    maxConnections: 20,
    retryAttempts: 3,
    retryDelayMs: 1000,
  },
  processing: {
    batchSize: 1000,
    maxConcurrentFiles: 5,
    maxMemoryMB: 512,
    enableStreaming: true,
    bufferSizeMB: 16,
    continueOnError: true,
  },
  csv: {
    fieldSeparator: "|", // Updated to match actual data format
    rowSeparator: "\n", // Updated to standard newline
    maxRowLength: 1000000,
    maxFieldLength: 5000,
    hasHeaders: false,
    skipEmptyRows: true,
  },
  errorHandling: {
    maxRetries: 3,
    retryDelayMs: 1000,
    continueOnError: true,
    logErrors: true,
    errorThreshold: 0.1, // 10% error rate threshold
  },
  monitoring: {
    enableMetrics: true,
    logLevel: "info",
    metricsInterval: 30000,
    enableProgressTracking: true,
    progressUpdateInterval: 5000,
  },
};

export const DEFAULT_DATABASE_CONFIG: DatabaseConfig = {
  poolSize: 10,
  timeoutMs: 30000,
  maxConnections: 20,
  retryAttempts: 3,
  retryDelayMs: 1000,
};

export const DEFAULT_PROCESSING_CONFIG: ProcessingConfig = {
  batchSize: 1000,
  maxConcurrentFiles: 5,
  maxMemoryMB: 512,
  enableStreaming: true,
  bufferSizeMB: 16,
  continueOnError: true,
};

export const DEFAULT_CSV_CONFIG: CSVConfig = {
  fieldSeparator: "|~~|",
  rowSeparator: "|^^|",
  maxRowLength: 10000,
  hasHeaders: false,
  skipEmptyRows: true,
};

export const DEFAULT_ERROR_HANDLING_CONFIG: ErrorHandlingConfig = {
  maxRetries: 3,
  retryDelayMs: 1000,
  continueOnError: true,
  logErrors: true,
  errorThreshold: 0.1,
};

export const DEFAULT_MONITORING_CONFIG: MonitoringConfig = {
  enableMetrics: true,
  logLevel: "info",
  metricsInterval: 30000,
  enableProgressTracking: true,
  progressUpdateInterval: 5000,
};
