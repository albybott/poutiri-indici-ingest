/**
 * Core Merger Service - Exports
 *
 * The Core Merger loads validated staging data into the core dimensional model
 * with SCD2 change tracking for dimensions and proper FK resolution for facts.
 */

// Type exports
export type {
  CoreMergerConfig,
  DimensionConfig,
  FactConfig,
  CacheConfig,
  ErrorHandlingConfig,
  MonitoringConfig,
} from "./types/config";

export {
  MissingDimensionStrategy,
  defaultCoreMergerConfig,
} from "./types/config";

export type {
  DimensionType,
  ChangeType,
  SCD2Change,
  AttributeChange,
  DimensionRecord,
  LineageMetadata,
  ComparisonRule,
  SCD2Config,
  SCD2LoadResult,
  SCD2Error,
} from "./types/scd2";

export {
  DimensionType as DimType,
  ChangeType as ChangeTypeEnum,
} from "./types/scd2";

export type {
  DimensionHandlerConfig,
  DimensionLoadOptions,
  DimensionLoadResult,
  DimensionError,
  PatientStagingData,
  ProviderStagingData,
  PracticeStagingData,
} from "./types/dimension";

export type {
  FactType,
  FactHandlerConfig,
  ForeignKeyRelationship,
  FactLoadOptions,
  FactLoadResult,
  FactError,
  ResolvedForeignKey,
  ResolvedFactRecord,
  AppointmentStagingData,
} from "./types/fact";

export { FactType as FType } from "./types/fact";

export type {
  CoreMergeOptions,
  CoreMergeResult,
  CoreMergeRunStatus,
  LoadPlan,
  LoadProgress,
  ValidationResult,
} from "./types/core-merger";

// Component exports
export { SCD2Engine } from "./dimension/scd2-engine";
export { DimensionLoader } from "./dimension/dimension-loader";
export { BaseDimensionHandler } from "./dimension/handlers/base-dimension-handler";
export { PatientDimensionHandler } from "./dimension/handlers/patient-dimension-handler";
export { ProviderDimensionHandler } from "./dimension/handlers/provider-dimension-handler";
export { PracticeDimensionHandler } from "./dimension/handlers/practice-dimension-handler";

export { ForeignKeyResolver } from "./fact/foreign-key-resolver";
export { FactLoader } from "./fact/fact-loader";
export { appointmentFactConfig } from "./fact/handlers/appointment-fact-handler";

export { CoreMergerService } from "./core-merger-service";
export {
  CoreMergerContainer,
  type PartialCoreMergerConfig,
} from "./core-merger-container";
export { CoreAuditService } from "./core-audit-service";
export { LoadMonitor } from "./load-monitor";

// Utility exports
export * from "./utils/hash-utils";
export * from "./utils/scd2-utils";
export * from "./utils/business-key-utils";
