/**
 * Dimension loading types
 */

import type { DimensionType } from "./scd2";

/**
 * Configuration for dimension handler
 */
export interface DimensionHandlerConfig {
  /** Dimension type */
  dimensionType: DimensionType;

  /** Source staging table */
  sourceTable: string;

  /** Target core dimension table */
  targetTable: string;

  /** Business key field names */
  businessKeyFields: string[];

  /** Significant fields that trigger SCD2 versioning */
  significantFields: string[];

  /** Non-significant fields (updated in place) */
  nonSignificantFields: string[];

  /** Field mappings from staging to dimension */
  fieldMappings: FieldMapping[];
}

/**
 * Field mapping from staging to dimension
 */
export interface FieldMapping {
  /** Source field name in staging table */
  sourceField: string;

  /** Target field name in dimension table */
  targetField: string;

  /** Is this field required? */
  required: boolean;

  /** Default value if source is null */
  defaultValue?: unknown;

  /** Transform function */
  transform?: (value: unknown) => unknown;
}

/**
 * Options for loading a dimension
 */
export interface DimensionLoadOptions {
  /** Load run ID for tracking */
  loadRunId: string;

  /** Staging run ID for data selection */
  stagingRunId: string;

  /** Extract type being processed */
  extractType: string;

  /** Batch size for processing */
  batchSize?: number;

  /** Enable SCD2 change tracking */
  enableSCD2?: boolean;

  /** Dry run mode (validate but don't commit) */
  dryRun?: boolean;

  /** Continue on errors */
  continueOnError?: boolean;
}

/**
 * Result of dimension loading
 */
export interface DimensionLoadResult {
  /** Dimension type loaded */
  dimensionType: DimensionType;

  /** Extract type processed */
  extractType: string;

  /** Total rows read from staging */
  totalRowsRead: number;

  /** New dimension records created */
  recordsCreated: number;

  /** Existing records updated (new versions) */
  recordsUpdated: number;

  /** Records expired (set effectiveTo) */
  recordsExpired: number;

  /** Records skipped (no change) */
  recordsSkipped: number;

  /** Successful batches */
  successfulBatches: number;

  /** Failed batches */
  failedBatches: number;

  /** Duration in milliseconds */
  durationMs: number;

  /** Processing rate (rows/second) */
  rowsPerSecond: number;

  /** Memory usage in MB */
  memoryUsageMB: number;

  /** Errors encountered */
  errors: DimensionError[];

  /** Warnings */
  warnings: string[];
}

/**
 * Dimension-specific error
 */
export interface DimensionError {
  /** Error type */
  errorType:
    | "business_key_missing"
    | "duplicate_current_version"
    | "constraint_violation"
    | "transformation_error"
    | "database_error";

  /** Error message */
  message: string;

  /** Business key of problematic record */
  businessKey?: Record<string, unknown>;

  /** Source row number (if available) */
  rowNumber?: number;

  /** Stack trace */
  stack?: string;
}

/**
 * Dimension lookup cache entry
 */
export interface DimensionCacheEntry {
  /** Dimension type */
  dimensionType: DimensionType;

  /** Business key values */
  businessKey: Record<string, unknown>;

  /** Surrogate key */
  surrogateKey: number;

  /** Is this the current version? */
  isCurrent: boolean;

  /** Effective from date */
  effectiveFrom: Date;

  /** Effective to date (null for current) */
  effectiveTo?: Date | null;

  /** When was this cached */
  cachedAt: Date;
}

/**
 * Patient dimension staging data
 */
export interface PatientStagingData {
  // Business keys
  patientId: string;
  practiceId: string;
  perOrgId: string;

  // Significant attributes (trigger SCD2)
  nhiNumber?: string | null;
  firstName?: string | null;
  middleName?: string | null;
  familyName: string;
  fullName: string;
  dob?: Date | null;
  gender?: string | null;
  isAlive?: boolean;
  deathDate?: Date | null;

  // Non-significant attributes (update in place)
  email?: string | null;
  cellNumber?: string | null;
  balance?: number | null;
  permanentAddressCity?: string | null;
  permanentAddressSuburb?: string | null;
  permanentAddressPostalCode?: string | null;

  // Status fields
  isActive?: boolean;
  isDeleted?: boolean;

  // Lineage
  s3VersionId: string;
  fileHash: string;
  dateExtracted: string;
  loadRunId: string;
}

/**
 * Provider dimension staging data
 */
export interface ProviderStagingData {
  // Business keys
  providerId: string;
  practiceId: string;
  perOrgId: string;

  // Significant attributes
  nhiNumber?: string | null;
  firstName?: string | null;
  familyName: string;
  fullName: string;
  dob?: Date | null;
  providerCode?: string | null;
  isActive?: boolean;

  // Non-significant attributes
  email?: string | null;
  cellNumber?: string | null;

  // Status
  isDeleted?: boolean;

  // Lineage
  s3VersionId: string;
  fileHash: string;
  dateExtracted: string;
  loadRunId: string;
}

/**
 * Practice dimension staging data
 */
export interface PracticeStagingData {
  // Business keys
  practiceId: string;
  perOrgId: string;

  // Significant attributes
  practiceName: string;
  legalStatus?: string | null;
  pho?: string | null;
  isActive?: boolean;

  // Non-significant attributes
  primaryPhone?: string | null;
  primaryEmail?: string | null;

  // Status
  isDeleted?: boolean;

  // Lineage
  s3VersionId: string;
  fileHash: string;
  dateExtracted: string;
  loadRunId: string;
}
