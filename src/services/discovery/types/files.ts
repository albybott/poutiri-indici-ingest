/**
 * File-related types
 */

export interface ParsedFilename {
  perOrgId: string; // "685146" - EBPHA PerOrgID
  practiceId: string; // "535" - Indici PracticeID
  extractType: string; // "Appointments", "Patients", etc.
  dateFrom: Date; // 2025-08-18 05:44
  dateTo: Date; // 2025-08-19 05:44
  dateExtracted: Date; // 2025-08-19 08:50
  isFullLoad: boolean; // Determined by filename pattern
  isDelta: boolean; // Determined by filename pattern
  batchId: string; // Formatted dateExtracted for batch grouping
}

export interface DiscoveredFile {
  s3Key: string;
  s3VersionId: string;
  fileSize: number;
  lastModified: Date;
  etag: string;
  parsed: ParsedFilename;
  fileHash?: string; // Calculated later for integrity checks
  checksum?: string; // S3 checksum for quick comparison
}

export interface FileBatch {
  dateExtracted: Date;
  batchId: string; // Formatted dateExtracted for unique identification
  files: DiscoveredFile[];
  totalFiles: number;
  totalSize: number;
  extractTypes: string[];
  isComplete: boolean; // Whether all expected files are present
}
