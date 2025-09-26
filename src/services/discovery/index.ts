/**
 * S3 Discovery Service - Main Exports
 */

// Core service
export { S3DiscoveryService } from "./s3-discovery-service";

// Components
export { FilenameParser } from "./filename-parser";
export { FileDiscovery } from "./file-discovery";
export { BatchProcessor } from "./batch-processor";
export { FileIntegrityService } from "./file-integrity-service";
export { DiscoveryMonitor } from "./discovery-monitor";

// Adapters
export { S3FileSystemAdapter } from "./adapters/s3-file-system-adapter";
export type {
  FileSystemAdapter,
  FileMetadata,
} from "./adapters/file-system-adapter";

// Types
export type {
  S3DiscoveryConfig,
  S3Config,
  DiscoveryConfig,
  ProcessingConfig,
  ExtractType,
  EXTRACT_TYPES,
} from "./types/config";

export type {
  DiscoveryOptions,
  ProcessingPlan,
  BatchProcessingOptions,
  ExtractTypeDependency,
  ValidationResult,
} from "./types/discovery";

export type { DiscoveredFile, FileBatch } from "./types/files";

export type { ParsedFilename } from "./filename-parser";

// Constants
export {
  DEFAULT_CONFIG,
  DEFAULT_S3_CONFIG,
  DEFAULT_DISCOVERY_CONFIG,
  DEFAULT_PROCESSING_CONFIG,
} from "./types/config";
