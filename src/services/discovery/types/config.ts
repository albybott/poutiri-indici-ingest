/**
 * Configuration types for S3 Discovery Service
 */

export interface S3Config {
  bucket: string; // "poutiri-datacraft-data"
  region: string; // "ap-southeast-2"
  prefix?: string; // Optional prefix for file filtering
  maxKeys?: number; // Limit for listObjects calls (default: 1000)
  maxConcurrency?: number; // For lib-storage operations (default: 4)
  partSize?: number; // Multipart upload part size (default: 5MB)
  retryAttempts?: number; // Retry attempts for failed operations (default: 3)
  timeoutMs?: number; // Request timeout in milliseconds (default: 30000)
}

export interface DiscoveryConfig {
  batchSize: number; // Number of files to process in each batch
  maxFilesPerBatch: number; // Maximum files per batch to prevent memory issues
  enableVersioning: boolean; // Whether to track S3 versioning
  validateHashes: boolean; // Whether to validate file integrity hashes
  cacheMetadata: boolean; // Whether to cache file metadata
  cacheTtlMinutes: number; // Time-to-live for cached metadata
}

export interface ProcessingConfig {
  priorityExtracts: ExtractType[]; // Priority order for processing extract types
  maxConcurrentFiles: number; // Maximum concurrent file processing
  processingTimeoutMs: number; // Timeout for individual file processing
}

export interface S3DiscoveryConfig {
  s3: S3Config;
  discovery: DiscoveryConfig;
  processing: ProcessingConfig;
}

/**
 * Extract types supported by the Indici system
 * These match the actual extract types found in S3 bucket filenames
 */
export type ExtractType =
  | "Patient"
  | "Appointments"
  | "Provider"
  | "PracticeInfo"
  | "Invoices"
  | "InvoiceDetail"
  | "Immunisation"
  | "Diagnosis"
  | "Measurements"
  | "Recalls"
  | "Inbox"
  | "InboxDetail"
  | "Medicine"
  | "NextOfKin"
  | "Vaccine"
  | "Allergies"
  | "AppointmentMedications"
  | "PatientAlerts";

export const EXTRACT_TYPES: readonly ExtractType[] = [
  "Patient",
  "Appointments",
  "Provider",
  "PracticeInfo",
  "Invoices",
  "InvoiceDetail",
  "Immunisation",
  "Diagnosis",
  "Measurements",
  "Recalls",
  "Inbox",
  "InboxDetail",
  "Medicine",
  "NextOfKin",
  "Vaccine",
  "Allergies",
  "AppointmentMedications",
  "PatientAlerts",
] as const;

/**
 * Default configuration values
 */
export const DEFAULT_S3_CONFIG: S3Config = {
  bucket: "poutiri-datacraft-data",
  region: "ap-southeast-2",
  prefix: "C:/Jobs/indici_export/ebpha_poutiri/working/", // Path where Indici files are stored (S3 uses forward slashes)
  maxKeys: 1000,
  maxConcurrency: 4,
  partSize: 1024 * 1024 * 5, // 5MB
  retryAttempts: 3,
  timeoutMs: 30000,
};

export const DEFAULT_DISCOVERY_CONFIG: DiscoveryConfig = {
  batchSize: 1000,
  maxFilesPerBatch: 100,
  enableVersioning: true,
  validateHashes: true,
  cacheMetadata: true,
  cacheTtlMinutes: 60,
};

export const DEFAULT_PROCESSING_CONFIG: ProcessingConfig = {
  priorityExtracts: ["Patient", "Appointments", "Provider"],
  maxConcurrentFiles: 10,
  processingTimeoutMs: 300000, // 5 minutes
};

export const DEFAULT_CONFIG: S3DiscoveryConfig = {
  s3: DEFAULT_S3_CONFIG,
  discovery: DEFAULT_DISCOVERY_CONFIG,
  processing: DEFAULT_PROCESSING_CONFIG,
};
