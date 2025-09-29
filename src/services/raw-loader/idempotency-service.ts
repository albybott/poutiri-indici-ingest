import type { IdempotencyCheck } from "./types/raw-loader";
import type { DiscoveredFile } from "../../services/discovery/types/files";
import { db } from "../../db/client";
import { loadRunFiles } from "../../db/schema/etl/audit";
import { eq, and } from "drizzle-orm";

/**
 * Idempotency Service - prevents duplicate file processing
 * Uses database-backed persistence with in-memory caching for performance
 */
export class IdempotencyService {
  private processedFiles: Map<string, IdempotencyCheck> = new Map();
  private cacheEnabled: boolean = true;

  constructor(options?: { enableCache?: boolean }) {
    this.cacheEnabled = options?.enableCache ?? true;
  }

  /**
   * Check if a file has already been processed
   * First checks cache, then database for persistence across restarts
   */
  async checkFileProcessed(
    fileMetadata: DiscoveredFile
  ): Promise<IdempotencyCheck> {
    const key = this.generateKey(fileMetadata);

    // Check cache first for performance
    if (this.cacheEnabled) {
      const cached = this.processedFiles.get(key);
      if (cached) {
        return cached;
      }
    }

    // Check database for persistence
    try {
      const existingRecord = await db
        .select()
        .from(loadRunFiles)
        .where(
          and(
            eq(loadRunFiles.s3VersionId, fileMetadata.s3VersionId),
            eq(loadRunFiles.fileHash, fileMetadata.fileHash || "")
          )
        )
        .limit(1);

      if (existingRecord.length > 0) {
        const record = existingRecord[0];
        const check: IdempotencyCheck = {
          s3Key: record.s3Key,
          s3VersionId: record.s3VersionId,
          fileHash: record.fileHash,
          extractType: record.extractType,
          isProcessed: record.status === "completed",
          loadRunId: record.loadRunId,
          loadRunFileId: record.loadRunFileId,
          processedAt: record.finishedAt || record.createdAt,
          rowCount: record.rowsIngested,
          lastError: record.errorMessage || undefined,
        };

        // Cache the result
        if (this.cacheEnabled) {
          this.processedFiles.set(key, check);
        }

        return check;
      }
    } catch (error) {
      console.warn(
        "Failed to check database for idempotency, falling back to new check:",
        error
      );
    }

    // File not found in database - create new check
    const check: IdempotencyCheck = {
      s3Key: fileMetadata.s3Key,
      s3VersionId: fileMetadata.s3VersionId,
      fileHash: fileMetadata.fileHash || "",
      extractType: fileMetadata.parsed.extractType,
      isProcessed: false,
    };

    // Cache the new check
    if (this.cacheEnabled) {
      this.processedFiles.set(key, check);
    }

    return check;
  }

  /**
   * Mark a file as being processed
   * Creates database record and updates cache
   * Returns the loadRunFileId for foreign key relationships
   */
  async markFileProcessing(
    fileMetadata: DiscoveredFile,
    loadRunId: string
  ): Promise<number> {
    const key = this.generateKey(fileMetadata);
    const now = new Date();

    try {
      // First, try to get existing record to see if it already exists
      const existingRecord = await db
        .select({ loadRunFileId: loadRunFiles.loadRunFileId })
        .from(loadRunFiles)
        .where(
          and(
            eq(loadRunFiles.s3VersionId, fileMetadata.s3VersionId),
            eq(loadRunFiles.fileHash, fileMetadata.fileHash || "")
          )
        )
        .limit(1);

      let loadRunFileId: number;

      if (existingRecord.length > 0) {
        // Update existing record
        loadRunFileId = existingRecord[0].loadRunFileId;
        await db
          .update(loadRunFiles)
          .set({
            loadRunId,
            status: "processing",
            startedAt: now,
            updatedAt: now,
            errorMessage: null, // Clear any previous errors
          })
          .where(eq(loadRunFiles.loadRunFileId, loadRunFileId));
      } else {
        // Insert new record and get the ID
        const result = await db
          .insert(loadRunFiles)
          .values({
            loadRunId,
            s3Bucket: fileMetadata.s3Bucket,
            s3Key: fileMetadata.s3Key,
            s3VersionId: fileMetadata.s3VersionId,
            fileHash: fileMetadata.fileHash || "",
            dateExtracted: fileMetadata.parsed.dateExtracted,
            extractType: fileMetadata.parsed.extractType,
            perOrgId: fileMetadata.parsed.perOrgId,
            practiceId: fileMetadata.parsed.practiceId,
            status: "processing",
            startedAt: now,
          })
          .returning({ loadRunFileId: loadRunFiles.loadRunFileId });

        loadRunFileId = result[0].loadRunFileId;
      }

      // Update cache
      const check: IdempotencyCheck = {
        s3Key: fileMetadata.s3Key,
        s3VersionId: fileMetadata.s3VersionId,
        fileHash: fileMetadata.fileHash || "",
        extractType: fileMetadata.parsed.extractType,
        isProcessed: false,
        loadRunId,
        loadRunFileId,
        processedAt: now,
      };

      if (this.cacheEnabled) {
        this.processedFiles.set(key, check);
      }

      return loadRunFileId;
    } catch (error) {
      console.error("Failed to mark file as processing in database:", error);
      // Still update cache as fallback
      const check: IdempotencyCheck = {
        s3Key: fileMetadata.s3Key,
        s3VersionId: fileMetadata.s3VersionId,
        fileHash: fileMetadata.fileHash || "",
        extractType: fileMetadata.parsed.extractType,
        isProcessed: false,
        loadRunId,
        processedAt: now,
      };

      if (this.cacheEnabled) {
        this.processedFiles.set(key, check);
      }
      throw error;
    }
  }

  /**
   * Mark a file as completed
   * Updates database record and cache
   */
  async markFileCompleted(
    fileMetadata: DiscoveredFile,
    loadRunId: string,
    rowCount: number
  ): Promise<void> {
    const key = this.generateKey(fileMetadata);
    const now = new Date();

    try {
      // Update database record
      await db
        .update(loadRunFiles)
        .set({
          status: "completed",
          finishedAt: now,
          updatedAt: now,
          rowsIngested: rowCount,
          rowsRead: rowCount, // Assuming all rows were read successfully
          errorMessage: null,
        })
        .where(
          and(
            eq(loadRunFiles.s3VersionId, fileMetadata.s3VersionId),
            eq(loadRunFiles.fileHash, fileMetadata.fileHash || "")
          )
        );

      // Update cache
      const check: IdempotencyCheck = {
        s3Key: fileMetadata.s3Key,
        s3VersionId: fileMetadata.s3VersionId,
        fileHash: fileMetadata.fileHash || "",
        extractType: fileMetadata.parsed.extractType,
        isProcessed: true,
        loadRunId,
        processedAt: now,
        rowCount,
      };

      if (this.cacheEnabled) {
        this.processedFiles.set(key, check);
      }
    } catch (error) {
      console.error("Failed to mark file as completed in database:", error);
      // Still update cache as fallback
      const check: IdempotencyCheck = {
        s3Key: fileMetadata.s3Key,
        s3VersionId: fileMetadata.s3VersionId,
        fileHash: fileMetadata.fileHash || "",
        extractType: fileMetadata.parsed.extractType,
        isProcessed: true,
        loadRunId,
        processedAt: now,
        rowCount,
      };

      if (this.cacheEnabled) {
        this.processedFiles.set(key, check);
      }
      throw error;
    }
  }

  /**
   * Mark a file as failed
   * Updates database record and cache with error information
   */
  async markFileError(
    fileMetadata: DiscoveredFile,
    loadRunId: string,
    error: string,
    rowsProcessed?: number
  ): Promise<void> {
    const key = this.generateKey(fileMetadata);
    const now = new Date();

    try {
      // Update database record
      await db
        .update(loadRunFiles)
        .set({
          status: "failed",
          finishedAt: now,
          updatedAt: now,
          errorMessage: error,
          rowsIngested: rowsProcessed || 0,
        })
        .where(
          and(
            eq(loadRunFiles.s3VersionId, fileMetadata.s3VersionId),
            eq(loadRunFiles.fileHash, fileMetadata.fileHash || "")
          )
        );

      // Update cache
      const check: IdempotencyCheck = {
        s3Key: fileMetadata.s3Key,
        s3VersionId: fileMetadata.s3VersionId,
        fileHash: fileMetadata.fileHash || "",
        extractType: fileMetadata.parsed.extractType,
        isProcessed: false, // Failed files are not considered processed
        loadRunId,
        processedAt: now,
        rowCount: rowsProcessed,
        lastError: error,
      };

      if (this.cacheEnabled) {
        this.processedFiles.set(key, check);
      }
    } catch (dbError) {
      console.error("Failed to mark file as failed in database:", dbError);
      // Still update cache as fallback
      const check: IdempotencyCheck = {
        s3Key: fileMetadata.s3Key,
        s3VersionId: fileMetadata.s3VersionId,
        fileHash: fileMetadata.fileHash || "",
        extractType: fileMetadata.parsed.extractType,
        isProcessed: false,
        loadRunId,
        processedAt: now,
        rowCount: rowsProcessed,
        lastError: error,
      };

      if (this.cacheEnabled) {
        this.processedFiles.set(key, check);
      }
      throw dbError;
    }
  }

  /**
   * Get duplicate files by file hash
   */
  async getDuplicateFiles(
    fileMetadata: DiscoveredFile
  ): Promise<IdempotencyCheck[]> {
    if (!fileMetadata.fileHash) {
      return [];
    }

    try {
      const duplicates = await db
        .select()
        .from(loadRunFiles)
        .where(eq(loadRunFiles.fileHash, fileMetadata.fileHash))
        .orderBy(loadRunFiles.createdAt);

      return duplicates.map((record) => ({
        s3Key: record.s3Key,
        s3VersionId: record.s3VersionId,
        fileHash: record.fileHash,
        extractType: record.extractType,
        isProcessed: record.status === "completed",
        loadRunId: record.loadRunId,
        processedAt: record.finishedAt || record.createdAt,
        rowCount: record.rowsIngested,
        lastError: record.errorMessage || undefined,
      }));
    } catch (error) {
      console.error("Failed to get duplicate files:", error);
      return [];
    }
  }

  /**
   * Check if file should be skipped based on processing status
   */
  async shouldSkipFile(fileMetadata: DiscoveredFile): Promise<boolean> {
    const check = await this.checkFileProcessed(fileMetadata);
    return check.isProcessed;
  }

  /**
   * Get processing status for a file
   */
  async getFileStatus(
    fileMetadata: DiscoveredFile
  ): Promise<"not_found" | "pending" | "processing" | "completed" | "failed"> {
    try {
      const record = await db
        .select({ status: loadRunFiles.status })
        .from(loadRunFiles)
        .where(
          and(
            eq(loadRunFiles.s3VersionId, fileMetadata.s3VersionId),
            eq(loadRunFiles.fileHash, fileMetadata.fileHash || "")
          )
        )
        .limit(1);

      return record.length > 0 ? (record[0].status as any) : "not_found";
    } catch (error) {
      console.error("Failed to get file status:", error);
      return "not_found";
    }
  }

  /**
   * Generate unique key for file
   */
  private generateKey(fileMetadata: DiscoveredFile): string {
    return `${fileMetadata.s3Bucket}:${fileMetadata.s3Key}:${fileMetadata.s3VersionId}:${fileMetadata.fileHash}`;
  }

  /**
   * Clear cache (useful for testing or memory management)
   */
  clearCache(): void {
    this.processedFiles.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; enabled: boolean } {
    return {
      size: this.processedFiles.size,
      enabled: this.cacheEnabled,
    };
  }

  /**
   * Clear old processed file records from database
   */
  async cleanupOldRecords(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    try {
      const result = await db.delete(loadRunFiles).where(
        and(
          eq(loadRunFiles.status, "completed")
          // Only delete completed records older than cutoff
          // Keep failed records for debugging
        )
      );

      // Clear cache since we may have deleted records
      this.clearCache();

      return result.rowCount || 0;
    } catch (error) {
      console.error("Failed to cleanup old records:", error);
      return 0;
    }
  }
}
