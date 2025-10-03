/**
 * Shared services - common patterns and utilities for ETL stage services
 */

// Interfaces
export type { IRunService } from "./interfaces/run-service";

// Base services
export { BaseRunService } from "./base-run-service";

// Stage-specific run services
export { LoadRunService } from "../raw-loader/load-run-service";
export { CoreMergeRunService } from "../core-merger/core-merge-run-service";
export { StagingRunService } from "../staging-transformer/staging-run-service";
