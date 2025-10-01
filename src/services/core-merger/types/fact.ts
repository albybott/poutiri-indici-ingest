/**
 * Fact loading types
 */

import type { DimensionType } from "./scd2";

/**
 * Types of facts supported
 */
export enum FactType {
  APPOINTMENT = "appointment",
  IMMUNISATION = "immunisation",
  INVOICE = "invoice",
  INVOICE_DETAIL = "invoice_detail",
  DIAGNOSIS = "diagnosis",
  MEASUREMENT = "measurement",
}

/**
 * Configuration for fact handler
 */
export interface FactHandlerConfig {
  /** Fact type */
  factType: FactType;

  /** Source staging table */
  sourceTable: string;

  /** Target core fact table */
  targetTable: string;

  /** Business key field names */
  businessKeyFields: string[];

  /** Foreign key relationships to dimensions */
  foreignKeyRelationships: ForeignKeyRelationship[];

  /** Field mappings from staging to fact */
  fieldMappings: FactFieldMapping[];
}

/**
 * Foreign key relationship definition
 */
export interface ForeignKeyRelationship {
  /** Dimension type this FK points to */
  dimensionType: DimensionType;

  /** FK column name in fact table */
  factColumn: string;

  /** Lookup fields in staging data (map to dimension business key) */
  lookupFields: string[];

  /** Is this FK required? */
  required: boolean;

  /** Strategy for handling missing dimension */
  missingStrategy: "error" | "skip" | "null" | "placeholder";

  /** Can FK be NULL in database? */
  nullable: boolean;
}

/**
 * Field mapping for facts
 */
export interface FactFieldMapping {
  /** Source field name in staging */
  sourceField: string;

  /** Target field name in fact table */
  targetField: string;

  /** Is this field required? */
  required: boolean;

  /** Default value if null */
  defaultValue?: unknown;

  /** Transform function */
  transform?: (value: unknown) => unknown;
}

/**
 * Options for loading facts
 */
export interface FactLoadOptions {
  /** Load run ID for tracking */
  loadRunId: string;

  /** Extract type being processed */
  extractType: string;

  /** Batch size for processing */
  batchSize?: number;

  /** Upsert mode: insert, update, or upsert */
  upsertMode?: "insert" | "update" | "upsert";

  /** Validate foreign keys */
  validateFKs?: boolean;

  /** Dry run mode */
  dryRun?: boolean;

  /** Continue on errors */
  continueOnError?: boolean;
}

/**
 * Result of fact loading
 */
export interface FactLoadResult {
  /** Fact type loaded */
  factType: FactType;

  /** Extract type processed */
  extractType: string;

  /** Total rows read from staging */
  totalRowsRead: number;

  /** Records inserted */
  recordsInserted: number;

  /** Records updated */
  recordsUpdated: number;

  /** Records skipped (missing FK) */
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
  errors: FactError[];

  /** Warnings */
  warnings: string[];

  /** Missing FK summary */
  missingFKSummary: Map<DimensionType, number>;
}

/**
 * Fact-specific error
 */
export interface FactError {
  /** Error type */
  errorType:
    | "missing_foreign_key"
    | "business_key_conflict"
    | "constraint_violation"
    | "transformation_error"
    | "database_error";

  /** Error message */
  message: string;

  /** Business key of problematic record */
  businessKey?: Record<string, unknown>;

  /** Missing dimension type (for FK errors) */
  missingDimensionType?: DimensionType;

  /** Source row number */
  rowNumber?: number;

  /** Stack trace */
  stack?: string;
}

/**
 * Resolved foreign key lookup
 */
export interface ResolvedForeignKey {
  /** Dimension type */
  dimensionType: DimensionType;

  /** Business key values used for lookup */
  businessKey: Record<string, unknown>;

  /** Resolved surrogate key (null if not found) */
  surrogateKey: number | null;

  /** Was dimension found? */
  found: boolean;

  /** Lookup timestamp */
  lookedUpAt: Date;
}

/**
 * Fact record with resolved FKs
 */
export interface ResolvedFactRecord {
  /** Original staging data */
  stagingData: Record<string, unknown>;

  /** Resolved foreign keys */
  resolvedFKs: Map<DimensionType, ResolvedForeignKey>;

  /** All FKs resolved successfully? */
  allFKsResolved: boolean;

  /** Missing required FKs */
  missingRequiredFKs: DimensionType[];

  /** Fact attributes */
  attributes: Record<string, unknown>;

  /** Can this record be inserted? */
  canInsert: boolean;

  /** Skip reason (if canInsert is false) */
  skipReason?: string;
}

/**
 * Appointment fact staging data
 */
export interface AppointmentStagingData {
  // Business keys
  appointmentId: string;
  practiceId: string;
  perOrgId: string;

  // Foreign key lookups
  patientId?: string | null;
  providerId?: string | null;

  // Appointment attributes
  appointmentType?: string | null;
  appointmentStatus?: string | null;
  scheduleDate?: Date | null;
  startTime?: Date | null;
  endTime?: Date | null;
  duration?: number | null;
  arrived?: boolean;
  appointmentCompleted?: boolean;

  // Lineage
  s3VersionId: string;
  fileHash: string;
  dateExtracted: string;
  loadRunId: string;
}
