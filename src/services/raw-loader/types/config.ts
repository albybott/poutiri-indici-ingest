/**
 * Raw Loader Configuration Types
 */

import {
  LogLevels,
  type LoggerOptions,
  type LogLevel,
} from "@/services/shared/utils/logger";

// Indici CSV Format Constants
export const IndiciCsvSeparators = {
  fieldSeparator: "|^^|",
  rowSeparator: "|~~|",
} as const;

export interface RawLoaderConfig {
  database: DatabaseConfig;
  processing: ProcessingConfig;
  errorHandling: ErrorHandlingConfig;
  monitoring: MonitoringConfig;
  logging: LoggerOptions;
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
  forceReprocess?: boolean;
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
  // TODO: Do we need this? as we use the logger now?
  logLevel: LogLevel;
  metricsInterval: number;
  enableProgressTracking?: boolean;
  progressUpdateInterval?: number;
}

// Default configuration constants
export const DefaultRawLoaderConfig: RawLoaderConfig = {
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
  errorHandling: {
    maxRetries: 3,
    retryDelayMs: 1000,
    continueOnError: true,
    logErrors: true,
    errorThreshold: 0.1, // 10% error rate threshold
  },
  monitoring: {
    enableMetrics: true,
    logLevel: LogLevels.INFO,
    metricsInterval: 30000,
    enableProgressTracking: true,
    progressUpdateInterval: 5000,
  },
  logging: {
    level: LogLevels.INFO,
    prefix: "[RawLoader]",
  },
};

export const DefaultDatabaseConfig: DatabaseConfig = {
  poolSize: 10,
  timeoutMs: 30000,
  maxConnections: 20,
  retryAttempts: 3,
  retryDelayMs: 1000,
};

export const DefaultProcessingConfig: ProcessingConfig = {
  batchSize: 1000,
  maxConcurrentFiles: 5,
  maxMemoryMB: 512,
  enableStreaming: true,
  bufferSizeMB: 16,
  continueOnError: true,
};

export const DefaultCsvConfig: CSVConfig = {
  fieldSeparator: IndiciCsvSeparators.fieldSeparator,
  rowSeparator: IndiciCsvSeparators.rowSeparator,
  maxRowLength: 10000000, // Increased to handle long patient records
  hasHeaders: false,
  skipEmptyRows: true,
};

export const DefaultErrorHandlingConfig: ErrorHandlingConfig = {
  maxRetries: 3,
  retryDelayMs: 1000,
  continueOnError: true,
  logErrors: true,
  errorThreshold: 0.1,
};

export const DefaultMonitoringConfig: MonitoringConfig = {
  enableMetrics: true,
  logLevel: "info",
  metricsInterval: 30000,
  enableProgressTracking: true,
  progressUpdateInterval: 5000,
};
