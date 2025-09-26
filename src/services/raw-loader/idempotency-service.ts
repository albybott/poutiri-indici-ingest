import type { IdempotencyCheck } from "./types/raw-loader";
import type { DiscoveredFile } from "../../services/discovery/types/files";

/**
 * Idempotency Service - prevents duplicate file processing
 */
export class IdempotencyService {
  private processedFiles: Map<string, IdempotencyCheck> = new Map();

  /**
   * Check if a file has already been processed
   */
  async checkFileProcessed(
    fileMetadata: DiscoveredFile
  ): Promise<IdempotencyCheck> {
    const key = this.generateKey(fileMetadata);

    const existing = this.processedFiles.get(key);

    if (existing) {
      return existing;
    }

    // In a real implementation, this would check the database
    // For now, create a new check
    const check: IdempotencyCheck = {
      s3Key: fileMetadata.s3Key,
      s3VersionId: fileMetadata.s3VersionId,
      fileHash: fileMetadata.fileHash || "",
      extractType: fileMetadata.parsed.extractType,
      isProcessed: false,
    };

    this.processedFiles.set(key, check);
    return check;
  }

  /**
   * Mark a file as being processed
   */
  async markFileProcessing(
    fileMetadata: DiscoveredFile,
    loadRunId: string
  ): Promise<void> {
    const key = this.generateKey(fileMetadata);
    const check: IdempotencyCheck = {
      s3Key: fileMetadata.s3Key,
      s3VersionId: fileMetadata.s3VersionId,
      fileHash: fileMetadata.fileHash || "",
      extractType: fileMetadata.parsed.extractType,
      isProcessed: false,
      loadRunId,
      processedAt: new Date(),
    };

    this.processedFiles.set(key, check);
  }

  /**
   * Mark a file as completed
   */
  async markFileCompleted(
    fileMetadata: DiscoveredFile,
    loadRunId: string,
    rowCount: number
  ): Promise<void> {
    const key = this.generateKey(fileMetadata);
    const check: IdempotencyCheck = {
      s3Key: fileMetadata.s3Key,
      s3VersionId: fileMetadata.s3VersionId,
      fileHash: fileMetadata.fileHash || "",
      extractType: fileMetadata.parsed.extractType,
      isProcessed: true,
      loadRunId,
      processedAt: new Date(),
      rowCount,
    };

    this.processedFiles.set(key, check);
  }

  /**
   * Get duplicate files
   */
  async getDuplicateFiles(
    fileMetadata: DiscoveredFile
  ): Promise<DiscoveredFile[]> {
    // This would check for files with same content hash
    return [];
  }

  /**
   * Check if file should be skipped
   */
  async shouldSkipFile(fileMetadata: DiscoveredFile): Promise<boolean> {
    const check = await this.checkFileProcessed(fileMetadata);
    return check.isProcessed;
  }

  /**
   * Generate unique key for file
   */
  private generateKey(fileMetadata: DiscoveredFile): string {
    return `${fileMetadata.s3Bucket}:${fileMetadata.s3Key}:${fileMetadata.s3VersionId}:${fileMetadata.fileHash}`;
  }

  /**
   * Clear old processed file records
   */
  async cleanupOldRecords(olderThanDays: number): Promise<number> {
    // This would clean up old records from database
    return 0;
  }
}
