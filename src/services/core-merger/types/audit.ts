/**
 * Audit and lineage tracking types for Core Merger
 */

import type { DimensionType } from "./scd2";
import type { FactType } from "./fact";
import type { AttributeChange } from "./scd2";

/**
 * Core lineage record for traceability
 */
export interface CoreLineageRecord {
  /** Merge run ID */
  mergeRunId: string;

  /** Load run ID from staging */
  loadRunId: string;

  /** Extract type processed */
  extractType: string;

  /** S3 version ID of source file */
  s3VersionId: string;

  /** Hash of source file */
  fileHash: string;

  /** Date extracted from source system */
  dateExtracted: string;

  /** Staging records processed */
  stagingRecordsProcessed: number;

  /** Dimensions created */
  dimensionsCreated: number;

  /** Dimensions updated (new versions) */
  dimensionsUpdated: number;

  /** Dimensions expired */
  dimensionsExpired: number;

  /** Facts inserted */
  factsInserted: number;

  /** Facts updated */
  factsUpdated: number;

  /** Facts skipped */
  factsSkipped: number;

  /** Integrity violations */
  integrityViolations: number;

  /** Processing start time */
  processingStartTime: Date;

  /** Processing end time */
  processingEndTime: Date;

  /** Duration in milliseconds */
  durationMs: number;

  /** Status */
  status: "completed" | "partial" | "failed";

  /** Error count */
  errorCount: number;
}

/**
 * SCD2 audit record for dimension changes
 */
export interface SCD2AuditRecord {
  /** Audit ID */
  auditId: string;

  /** Merge run ID */
  mergeRunId: string;

  /** Dimension type */
  dimensionType: DimensionType;

  /** Business key */
  businessKey: Record<string, unknown>;

  /** Change type */
  changeType: "insert" | "update" | "expire" | "no_change";

  /** Attribute changes */
  attributeChanges: AttributeChange[];

  /** Previous record ID (surrogate key) */
  previousRecordId?: number;

  /** New record ID (surrogate key) */
  newRecordId: number;

  /** Change timestamp */
  changedAt: Date;

  /** Load run that caused the change */
  changedByLoadRun: string;

  /** Change reason/description */
  changeReason: string;

  /** Hash of attributes (if using hash strategy) */
  attributeHash?: string;
}

/**
 * Foreign key resolution audit
 */
export interface FKResolutionAudit {
  /** Audit ID */
  auditId: string;

  /** Merge run ID */
  mergeRunId: string;

  /** Fact type */
  factType: FactType;

  /** Fact business key */
  factBusinessKey: Record<string, unknown>;

  /** Dimension type being resolved */
  dimensionType: DimensionType;

  /** Lookup business key */
  lookupBusinessKey: Record<string, unknown>;

  /** Resolution result */
  resolutionResult: "found" | "not_found" | "cached";

  /** Resolved surrogate key */
  resolvedSurrogateKey?: number;

  /** Resolution timestamp */
  resolvedAt: Date;

  /** Cache hit? */
  cacheHit: boolean;
}

/**
 * Traceability report for end-to-end lineage
 */
export interface TraceabilityReport {
  /** Business key being traced */
  businessKey: Record<string, unknown>;

  /** Entity type (dimension or fact) */
  entityType: "dimension" | "fact";

  /** Entity name */
  entityName: string;

  /** Original S3 file */
  originalS3File: string;

  /** Staging processing trace */
  stagingTrace: StagingTrace[];

  /** Core loading trace */
  coreTrace: CoreTrace[];

  /** Current dimension versions */
  currentDimensionVersions: DimensionTrace[];

  /** Related facts */
  relatedFacts: FactTrace[];

  /** Full chain of transformations */
  fullChain: TraceChain[];
}

/**
 * Staging trace entry
 */
export interface StagingTrace {
  /** Load run ID */
  loadRunId: string;

  /** Raw table */
  rawTable: string;

  /** Staging table */
  stagingTable: string;

  /** Processed at */
  processedAt: Date;

  /** Record status */
  status: "loaded" | "rejected" | "transformed";
}

/**
 * Core trace entry
 */
export interface CoreTrace {
  /** Merge run ID */
  mergeRunId: string;

  /** Load run ID */
  loadRunId: string;

  /** Core table */
  coreTable: string;

  /** Processed at */
  processedAt: Date;

  /** Change type */
  changeType: "new" | "updated" | "no_change";

  /** Version number (for dimensions) */
  version?: number;
}

/**
 * Dimension trace entry
 */
export interface DimensionTrace {
  /** Dimension type */
  dimensionType: DimensionType;

  /** Surrogate key */
  surrogateKey: number;

  /** Effective from */
  effectiveFrom: Date;

  /** Effective to */
  effectiveTo?: Date;

  /** Is current */
  isCurrent: boolean;

  /** Version number */
  version: number;
}

/**
 * Fact trace entry
 */
export interface FactTrace {
  /** Fact type */
  factType: FactType;

  /** Fact surrogate key */
  factKey: number;

  /** Related dimension keys */
  relatedDimensionKeys: Map<DimensionType, number>;

  /** Loaded at */
  loadedAt: Date;
}

/**
 * Trace chain entry
 */
export interface TraceChain {
  /** Step number */
  step: number;

  /** Stage name */
  stage: "s3" | "raw" | "staging" | "core";

  /** Table name */
  tableName: string;

  /** Timestamp */
  timestamp: Date;

  /** Operation */
  operation: string;

  /** Details */
  details: Record<string, unknown>;
}
