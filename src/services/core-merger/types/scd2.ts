/**
 * SCD2 (Slowly Changing Dimension Type 2) types
 */

/**
 * Types of dimensions supported
 */
export enum DimensionType {
  PATIENT = "patient",
  PROVIDER = "provider",
  PRACTICE = "practice",
  VACCINE = "vaccine",
  MEDICINE = "medicine",
}

/**
 * Change detection result
 */
export enum ChangeType {
  /** New record, insert as new dimension */
  NEW = "new",

  /** Significant change detected, create new version */
  UPDATED = "updated",

  /** No significant change, update in place */
  NO_CHANGE = "no_change",

  /** Record marked as deleted/inactive */
  DELETED = "deleted",
}

/**
 * SCD2 change detection result
 */
export interface SCD2Change {
  /** Type of change detected */
  changeType: ChangeType;

  /** Business key of the record */
  businessKey: Record<string, unknown>;

  /** List of attribute changes */
  attributeChanges: AttributeChange[];

  /** Previous version of the record (if exists) */
  previousVersion?: DimensionRecord;

  /** New version of the record */
  newVersion: DimensionRecord;

  /** Hash of tracked attributes (for hash strategy) */
  attributeHash?: string;

  /** Change significance score (0-1) */
  significanceScore: number;
}

/**
 * Individual attribute change
 */
export interface AttributeChange {
  /** Field name */
  fieldName: string;

  /** Old value */
  oldValue: unknown;

  /** New value */
  newValue: unknown;

  /** Type of change */
  changeType: "added" | "modified" | "deleted";

  /** Is this change significant enough to create new version? */
  significant: boolean;
}

/**
 * Generic dimension record structure
 */
export interface DimensionRecord {
  /** Surrogate key (generated) */
  surrogateKey?: number;

  /** Business keys */
  businessKey: Record<string, unknown>;

  /** Practice ID (part of business key) */
  practiceId: string;

  /** Per-org ID (part of business key) */
  perOrgId: string;

  /** SCD2 effective from timestamp */
  effectiveFrom: Date;

  /** SCD2 effective to timestamp (null for current) */
  effectiveTo?: Date | null;

  /** Is this the current version? */
  isCurrent: boolean;

  /** Dimension attributes */
  attributes: Record<string, unknown>;

  /** Lineage metadata */
  lineage: LineageMetadata;
}

/**
 * Lineage metadata for traceability
 * Links dimension/fact records back to load run
 * Detailed S3 lineage available via join to etl.load_runs/load_run_files
 */
export interface LineageMetadata {
  /** Load run ID from staging */
  loadRunId: string;

  /** Load timestamp */
  loadTs: Date;
}

/**
 * Comparison rule for determining significant changes
 */
export interface ComparisonRule {
  /** Field name to compare */
  fieldName: string;

  /** Comparison type */
  compareType: "exact" | "significant" | "always_version" | "never_version";

  /** Weight for significance scoring (0-1) */
  weight: number;

  /** Custom comparison function */
  customComparator?: (oldVal: unknown, newVal: unknown) => boolean;
}

/**
 * SCD2 configuration for a dimension type
 */
export interface SCD2Config {
  /** Dimension type */
  dimensionType: DimensionType;

  /** Fields that are part of business key */
  businessKeyFields: string[];

  /** Fields to track for changes (significant attributes) */
  trackedFields: string[];

  /** Comparison rules for each tracked field */
  comparisonRules: ComparisonRule[];

  /** Threshold for creating new version (0-1) */
  changeThreshold: number;
}

/**
 * Result of SCD2 loading operation
 */
export interface SCD2LoadResult {
  /** Dimension type loaded */
  dimensionType: DimensionType;

  /** Total records processed */
  totalRecords: number;

  /** New records inserted */
  newRecords: number;

  /** Records with significant changes (new versions created) */
  updatedRecords: number;

  /** Records with no change (skipped) */
  unchangedRecords: number;

  /** Records expired (effectiveTo set) */
  expiredRecords: number;

  /** Duration in milliseconds */
  durationMs: number;

  /** Errors encountered */
  errors: SCD2Error[];

  /** Warnings */
  warnings: string[];
}

/**
 * SCD2-specific error
 */
export interface SCD2Error {
  /** Error type */
  errorType:
    | "business_key_conflict"
    | "constraint_violation"
    | "change_detection_failed"
    | "database_error";

  /** Error message */
  message: string;

  /** Business key of problematic record */
  businessKey?: Record<string, unknown>;

  /** Stack trace (if available) */
  stack?: string;
}
