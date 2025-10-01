/**
 * Core Merger Service types
 */

import type { DimensionType } from "./scd2";
import type { FactType } from "./fact";
import type { DimensionLoadResult } from "./dimension";
import type { FactLoadResult } from "./fact";

/**
 * Options for core merge operation
 */
export interface CoreMergeOptions {
  /** Load run ID from staging */
  loadRunId: string;

  /** Extract types to process (e.g., ['Patient', 'Appointment']) */
  extractTypes?: string[];

  /** Enable dry run mode (validate but don't commit) */
  dryRun?: boolean;

  /** Skip idempotency check (force reprocess) */
  forceReprocess?: boolean;

  /** Batch size override */
  batchSize?: number;

  /** Timeout override (ms) */
  timeoutMs?: number;
}

/**
 * Result of core merge operation
 */
export interface CoreMergeResult {
  /** Merge run ID */
  mergeRunId: string;

  /** Load run ID from staging */
  loadRunId: string;

  /** Extract types processed */
  extractTypes: string[];

  /** Dimension load results */
  dimensionResults: Map<DimensionType, DimensionLoadResult>;

  /** Fact load results */
  factResults: Map<FactType, FactLoadResult>;

  /** Total dimensions created */
  dimensionsCreated: number;

  /** Total dimensions updated (new versions) */
  dimensionsUpdated: number;

  /** Total facts inserted */
  factsInserted: number;

  /** Total facts updated */
  factsUpdated: number;

  /** Total errors */
  totalErrors: number;

  /** Total warnings */
  totalWarnings: number;

  /** Processing duration (ms) */
  durationMs: number;

  /** Overall status */
  status: "completed" | "partial" | "failed";

  /** Started at */
  startedAt: Date;

  /** Completed at */
  completedAt?: Date;

  /** Was this a dry run? */
  dryRun: boolean;
}

/**
 * Core merge run status (for idempotency tracking)
 */
export interface CoreMergeRunStatus {
  /** Merge run ID */
  mergeRunId: string;

  /** Load run ID from staging */
  loadRunId: string;

  /** Extract type */
  extractType: string;

  /** Status */
  status: "running" | "completed" | "failed";

  /** Started at */
  startedAt: Date;

  /** Completed at */
  completedAt?: Date;

  /** Result summary */
  result?: CoreMergeResult;

  /** Error details (if failed) */
  error?: string;
}

/**
 * Load plan for orchestration
 */
export interface LoadPlan {
  /** Dimensions to load (in order) */
  dimensions: DimensionLoadPlan[];

  /** Facts to load (in order) */
  facts: FactLoadPlan[];

  /** Dependencies between loads */
  dependencies: LoadDependency[];

  /** Estimated duration (ms) */
  estimatedDuration: number;

  /** Risk level assessment */
  riskLevel: "low" | "medium" | "high";
}

/**
 * Dimension load plan
 */
export interface DimensionLoadPlan {
  /** Dimension type */
  dimensionType: DimensionType;

  /** Extract type */
  extractType: string;

  /** Estimated record count */
  estimatedRecords: number;

  /** Dependencies on other dimensions */
  dependencies: DimensionType[];

  /** Load order */
  loadOrder: number;
}

/**
 * Fact load plan
 */
export interface FactLoadPlan {
  /** Fact type */
  factType: FactType;

  /** Extract type */
  extractType: string;

  /** Estimated record count */
  estimatedRecords: number;

  /** Required dimensions */
  requiredDimensions: DimensionType[];

  /** Load order */
  loadOrder: number;
}

/**
 * Load dependency
 */
export interface LoadDependency {
  /** Dependent load (must wait) */
  dependent: DimensionType | FactType;

  /** Prerequisite load (must complete first) */
  prerequisite: DimensionType | FactType;

  /** Is this a hard dependency? */
  required: boolean;
}

/**
 * Load progress tracking
 */
export interface LoadProgress {
  /** Current phase */
  phase: "dimensions" | "facts" | "validation" | "complete";

  /** Current dimension being loaded */
  currentDimension?: DimensionType;

  /** Current fact being loaded */
  currentFact?: FactType;

  /** Total items to process */
  totalItems: number;

  /** Items processed */
  processedItems: number;

  /** Completion percentage */
  percentComplete: number;

  /** Estimated time remaining (ms) */
  estimatedTimeRemaining?: number;

  /** Current processing rate (items/sec) */
  currentRate: number;

  /** Started at */
  startedAt: Date;

  /** Last updated at */
  updatedAt: Date;
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Did validation pass? */
  passed: boolean;

  /** Validation errors */
  errors: ValidationError[];

  /** Validation warnings */
  warnings: string[];

  /** Can processing continue? */
  canContinue: boolean;
}

/**
 * Validation error
 */
export interface ValidationError {
  /** Error type */
  errorType:
    | "referential_integrity"
    | "constraint_violation"
    | "business_rule"
    | "data_quality";

  /** Error message */
  message: string;

  /** Affected table */
  tableName?: string;

  /** Affected record */
  recordId?: string;

  /** Severity */
  severity: "error" | "warning" | "info";
}
