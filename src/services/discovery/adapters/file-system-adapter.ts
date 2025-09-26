/**
 * File System Adapter Interface
 * Provides abstraction over file system operations for testability
 */

export interface FileMetadata {
  key: string;
  size: number;
  lastModified: Date;
  etag: string;
  versionId?: string;
  checksumAlgorithm?: string[];
  checksum?: Record<string, string>;
}

export interface FileSystemAdapter {
  /**
   * List files with optional prefix filtering
   */
  listFiles(prefix?: string): Promise<FileMetadata[]>;

  /**
   * Get a readable stream for a file
   */
  getFileStream(key: string): Promise<NodeJS.ReadableStream>;

  /**
   * Get metadata for a specific file
   */
  getFileMetadata(key: string): Promise<FileMetadata>;

  /**
   * Check if a file exists
   */
  fileExists(key: string): Promise<boolean>;

  /**
   * Get the size of a file
   */
  getFileSize(key: string): Promise<number>;
}
