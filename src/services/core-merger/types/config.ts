/**
 * Configuration types for Core Merger Service
 */

export interface CoreMergerConfig {
  /** Dimension loading configuration */
  dimension: DimensionConfig;

  /** Fact loading configuration */
  fact: FactConfig;

  /** Caching configuration */
  cache: CacheConfig;

  /** Error handling configuration */
  errorHandling: ErrorHandlingConfig;

  /** Monitoring configuration */
  monitoring: MonitoringConfig;
}

export interface DimensionConfig {
  /** Number of records to process in each batch */
  batchSize: number;

  /** Enable SCD2 change tracking */
  enableSCD2: boolean;

  /** SCD2 strategy: 'hash' for hash-based, 'field' for field-by-field comparison */
  scd2Strategy: "hash" | "field";

  /** Track all attributes or only significant ones */
  trackAllAttributes: boolean;

  /** Maximum number of concurrent dimension loads */
  maxConcurrentLoads: number;

  /** Timeout for dimension loading (ms) */
  timeoutMs: number;
}

export interface FactConfig {
  /** Number of records to process in each batch */
  batchSize: number;

  /** Enable foreign key validation */
  enableFKValidation: boolean;

  /** Strategy for handling missing dimensions */
  missingDimensionStrategy: MissingDimensionStrategy;

  /** Maximum number of concurrent fact loads */
  maxConcurrentLoads: number;

  /** Timeout for fact loading (ms) */
  timeoutMs: number;

  /** Allow partial inserts on errors */
  allowPartialInserts: boolean;
}

export interface CacheConfig {
  /** Enable dimension key caching */
  enableDimensionCache: boolean;

  /** Cache refresh interval (ms) */
  cacheRefreshInterval: number;

  /** Maximum cache size (number of records) */
  maxCacheSize: number;

  /** Cache TTL in milliseconds */
  cacheTtlMs: number;
}

export interface ErrorHandlingConfig {
  /** Continue processing on non-critical errors */
  continueOnError: boolean;

  /** Maximum number of errors before stopping */
  maxErrors: number;

  /** Maximum error rate (0-1) before stopping */
  maxErrorRate: number;

  /** Number of retry attempts for transient errors */
  maxRetries: number;

  /** Delay between retries (ms) */
  retryDelayMs: number;

  /** Enable detailed error logging */
  enableDetailedLogging: boolean;
}

export interface MonitoringConfig {
  /** Enable performance metrics collection */
  enableMetrics: boolean;

  /** Enable progress tracking */
  enableProgressTracking: boolean;

  /** Progress update interval (ms) */
  progressUpdateInterval: number;

  /** Log level */
  logLevel: "debug" | "info" | "warn" | "error";
}

/**
 * Strategy for handling missing dimensions when loading facts
 */
export enum MissingDimensionStrategy {
  /** Throw error and stop processing */
  ERROR = "error",

  /** Skip the fact record and log warning */
  SKIP = "skip",

  /** Set foreign key to NULL (if allowed) */
  NULL = "null",

  /** Create placeholder dimension for future enrichment */
  PLACEHOLDER = "placeholder",
}

/**
 * Default configuration values
 */
export const defaultCoreMergerConfig: CoreMergerConfig = {
  dimension: {
    batchSize: 500,
    enableSCD2: true,
    scd2Strategy: "hash",
    trackAllAttributes: false,
    maxConcurrentLoads: 1,
    timeoutMs: 300000, // 5 minutes
  },
  fact: {
    batchSize: 1000,
    enableFKValidation: true,
    missingDimensionStrategy: MissingDimensionStrategy.SKIP,
    maxConcurrentLoads: 2,
    timeoutMs: 300000,
    allowPartialInserts: true,
  },
  cache: {
    enableDimensionCache: true,
    cacheRefreshInterval: 60000, // 1 minute
    maxCacheSize: 1000000, // 1M records
    cacheTtlMs: 300000, // 5 minutes
  },
  errorHandling: {
    continueOnError: true,
    maxErrors: 1000,
    maxErrorRate: 0.05, // 5%
    maxRetries: 3,
    retryDelayMs: 1000,
    enableDetailedLogging: true,
  },
  monitoring: {
    enableMetrics: true,
    enableProgressTracking: true,
    progressUpdateInterval: 5000, // 5 seconds
    logLevel: "info",
  },
};
