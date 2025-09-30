/**
 * Raw Loader Service - Main Exports
 */

// Core service
export { RawLoaderService, RawLoaderContainer } from "./raw-loader-service";

// Components
export { CSVParser } from "./csv-parser";
export { RawTableLoader } from "./raw-table-loader";
export { ExtractHandlerFactory } from "./extract-handler-factory";
export { IdempotencyService } from "./idempotency-service";
export { LineageService } from "./lineage-service";
export { ErrorHandler } from "./error-handler";
export { LoadMonitor } from "./load-monitor";

// Types
export type {
  RawLoaderConfig,
  DatabaseConfig,
  ProcessingConfig,
  CSVConfig,
  ErrorHandlingConfig,
  MonitoringConfig,
} from "./types/config";

export type {
  RawLoadOptions,
  LoadResult,
  LoadError,
  LoadProgress,
  LoadStatus,
} from "./types/raw-loader";

export type { CSVParseOptions, CSVRow, ColumnMapping } from "./types/csv";

// Constants
export {
  DEFAULT_RAW_LOADER_CONFIG,
  DEFAULT_DATABASE_CONFIG,
  DEFAULT_PROCESSING_CONFIG,
  DEFAULT_CSV_CONFIG,
} from "./types/config";

// Error types and utilities
export type {
  ErrorSummary,
  RecoveryOptions,
  RecoveryResult,
  DataQualityReport,
  ProcessingException,
  BatchProcessingError,
  FileProcessingError,
  ConfigurationError,
  ResourceExhaustionError,
} from "./types/errors";

export { ErrorFactory } from "./types/errors";
