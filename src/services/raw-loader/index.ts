/**
 * Raw Loader Service - Main Exports
 *
 * This module serves as the primary entry point for the Raw Loader service,
 * providing a clean API for ingesting CSV data from S3 into PostgreSQL raw tables.
 * It exports all necessary components, types, and utilities for data loading operations.
 */

// ============================================================================
// CORE SERVICE EXPORTS
// ============================================================================

/**
 * Main service classes for raw data loading operations
 * - RawLoaderService: Primary service orchestrating the entire loading process
 * - RawLoaderFactory: Dependency injection factory for service configuration
 */
export { RawLoaderService } from "./raw-loader-service";
export { RawLoaderFactory } from "./raw-loader-factory";

// ============================================================================
// COMPONENT EXPORTS
// ============================================================================

/**
 * Core data processing components
 */
export { CSVParser } from "./csv-parser"; // Parses CSV files with configurable options
export { RawTableLoader } from "./raw-table-loader"; // Loads parsed data into raw database tables
export { StreamBatchProcessor } from "./stream-batch-processor"; // Processes large files in memory-efficient batches

/**
 * Service orchestration and management components
 */
export { ExtractHandlerFactory } from "./extract-handler-factory"; // Creates appropriate handlers for different extract types
export { IdempotencyService } from "./idempotency-service"; // Ensures data loading operations are idempotent
export { LineageService } from "./lineage-service"; // Tracks data lineage and provenance
export { ErrorHandler } from "./error-handler"; // Centralized error handling and recovery
export { LoadMonitor } from "./load-monitor"; // Monitors loading progress and performance metrics
export { LoadRunService } from "./load-run-service"; // Manages individual load run lifecycle

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/**
 * Configuration types for service setup and customization
 * These types define the structure for various configuration objects
 */
export type {
  RawLoaderConfig, // Main configuration for the raw loader service
  DatabaseConfig, // Database connection and pool configuration
  ProcessingConfig, // Data processing behavior configuration
  CSVConfig, // CSV parsing and validation configuration
  ErrorHandlingConfig, // Error handling and recovery configuration
  MonitoringConfig, // Monitoring and logging configuration
} from "./types/config";

/**
 * Core data loading operation types
 * These types define the structure for load operations and their results
 */
export type {
  RawLoadOptions, // Options for configuring a raw data load operation
  LoadResult, // Result object containing load operation outcome and metadata
  LoadError, // Error information for failed load operations
  LoadProgress, // Progress tracking information during load operations
  LoadStatus, // Enumeration of possible load operation statuses
  ProcessingBatchResult, // Result for a single batch within a processing plan
  ProcessingPlanResult, // Result for a complete processing plan execution
} from "./types/raw-loader";

/**
 * CSV processing types
 * These types define the structure for CSV parsing and data mapping
 */
export type {
  CSVParseOptions, // Configuration options for CSV parsing behavior
  CSVRow, // Structure representing a single CSV row as key-value pairs
  ColumnMapping, // Mapping configuration between CSV columns and database fields
} from "./types/csv";

// ============================================================================
// CONSTANT EXPORTS
// ============================================================================

/**
 * Default configuration constants
 * These provide sensible defaults for all configuration options
 */
export {
  DefaultRawLoaderConfig as DEFAULT_RAW_LOADER_CONFIG, // Default configuration for the raw loader service
  DefaultDatabaseConfig as DEFAULT_DATABASE_CONFIG, // Default database connection settings
  DefaultProcessingConfig as DEFAULT_PROCESSING_CONFIG, // Default data processing behavior
  DefaultCsvConfig as DEFAULT_CSV_CONFIG, // Default CSV parsing configuration
} from "./types/config";

// ============================================================================
// ERROR HANDLING EXPORTS
// ============================================================================

/**
 * Error types and utilities for comprehensive error handling
 * These types define various error scenarios and recovery mechanisms
 */
export type {
  ErrorSummary, // Summary of errors encountered during processing
  RecoveryOptions, // Options for error recovery strategies
  RecoveryResult, // Result of error recovery attempts
  DataQualityReport, // Report on data quality issues found during processing
  ProcessingException, // Base exception for processing-related errors
  BatchProcessingError, // Error specific to batch processing operations
  FileProcessingError, // Error specific to file processing operations
  ConfigurationError, // Error related to invalid or missing configuration
  ResourceExhaustionError, // Error when system resources are exhausted
} from "./types/errors";

/**
 * Error factory utility for creating standardized error instances
 * Provides consistent error creation and formatting across the service
 */
export { ErrorFactory } from "./types/errors";
