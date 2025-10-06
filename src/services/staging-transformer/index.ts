/**
 * Staging Transformer Service
 *
 * Entry point for staging transformation operations in the ETL pipeline.
 * This module provides a clean API for transforming raw healthcare data
 * from the raw tables into properly structured staging tables.
 *
 * The staging transformer handles:
 * - Data validation and cleansing
 * - Business rule application
 * - Data type conversions
 * - Referential integrity checks
 * - Error handling and rejection management
 */

// ============================================================================
// MAIN SERVICE EXPORTS
// ============================================================================

/**
 * Core service class that orchestrates the entire staging transformation process
 * Handles batch processing, error management, and progress tracking
 */
export { StagingTransformerService } from "./staging-transformer-service";

/**
 * Dependency injection container for staging transformer services
 * Manages service lifecycle and configuration
 */
export { StagingTransformerContainer } from "./staging-transformer-container";

// ============================================================================
// CORE COMPONENT EXPORTS
// ============================================================================

/**
 * Builds optimized SQL queries for extracting data from raw tables
 * Handles complex joins, filtering, and data aggregation
 */
export { RawQueryBuilder } from "./raw-query-builder";

/**
 * Executes data transformation logic according to business rules
 * Applies data cleansing, type conversions, and business logic
 */
export { TransformationEngine } from "./transformation-engine";

/**
 * Validates data integrity and business rule compliance
 * ValidationRuleBuilders: Fluent API for creating validation rules
 */
export { ValidationEngine, ValidationRuleBuilders } from "./validation-engine";

/**
 * Handles rejected records and error reporting
 * Manages data quality issues and provides detailed error information
 */
export { RejectionHandler } from "./rejection-handler";

/**
 * Loads transformed data into staging tables
 * Handles batch loading, conflict resolution, and performance optimization
 */
export { StagingTableLoader } from "./staging-table-loader";

/**
 * Creates StagingExtractHandler instances for different extract types
 * Provides factory pattern for handler management
 */
export { StagingHandlerFactory } from "./staging-handler-factory";

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/**
 * Configuration types for staging transformer services
 * Includes database connections, batch sizes, and validation rules
 */
export * from "./types/config";

/**
 * Core transformation types and interfaces
 * Defines data structures for staging operations and business rules
 */
export * from "./types/transformer";
