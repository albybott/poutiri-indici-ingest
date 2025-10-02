/**
 * S3 Discovery Service - Main Exports
 */

// Core service
export { S3DiscoveryService } from "./s3-discovery-service.js";

// Components
export { FilenameParser } from "./filename-parser.js";
export { FileDiscovery } from "./file-discovery.js";
export { BatchProcessor } from "./batch-processor.js";
export { FileIntegrityService } from "./file-integrity-service.js";
export { DiscoveryMonitor } from "./discovery-monitor.js";

// Adapters
export { S3FileSystemAdapter } from "./adapters/s3-file-system-adapter.js";
export type {
  FileSystemAdapter,
  FileMetadata,
} from "./adapters/file-system-adapter.js";

// Types
export type {
  S3DiscoveryConfig,
  S3Config,
  DiscoveryConfig,
  ProcessingConfig,
  ExtractType,
  EXTRACT_TYPES,
} from "./types/config.js";

export type {
  DiscoveryOptions,
  ProcessingPlan,
  BatchProcessingOptions,
  ExtractTypeDependency,
  ValidationResult,
} from "./types/discovery.js";

export type { DiscoveredFile, FileBatch } from "./types/files.js";

export type { ParsedFilename } from "./filename-parser.js";

// Constants
export {
  DEFAULT_CONFIG,
  DEFAULT_S3_CONFIG,
  DEFAULT_DISCOVERY_CONFIG,
  DEFAULT_PROCESSING_CONFIG,
} from "./types/config.js";
