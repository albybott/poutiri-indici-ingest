/**
 * File Discovery Engine
 * Handles S3 file listing, filtering, and batch grouping
 */

import type { FileSystemAdapter } from "./adapters/file-system-adapter";
import type { FilenameParser } from "./filename-parser";
import type { DiscoveryOptions } from "./types/discovery";
import type { DiscoveredFile, FileBatch } from "./types/files";

export class FileDiscovery {
  constructor(
    private fileSystemAdapter: FileSystemAdapter,
    private filenameParser: FilenameParser
  ) {}

  /**
   * Discover files from the file system
   * @param options - The discovery options
   * @returns The discovered files
   */
  async discoverFiles(options?: DiscoveryOptions): Promise<DiscoveredFile[]> {
    try {
      // Get all files from S3
      const fileMetadata = await this.fileSystemAdapter.listFiles();

      // Filter and parse files
      const discoveredFiles: DiscoveredFile[] = [];

      for (const file of fileMetadata) {
        // Skip directories and non-CSV files
        if (file.key.endsWith("/") || !file.key.endsWith(".csv")) {
          continue;
        }

        // Parse filename to extract metadata
        const parsedFilename = this.filenameParser.parseFilename(file.key);
        if (!parsedFilename) {
          console.warn(`Could not parse filename: ${file.key}`);
          continue;
        }

        // Filter by extract types if specified
        if (options?.extractTypes && options.extractTypes.length > 0) {
          if (
            !options.extractTypes.includes(parsedFilename.extractType as any)
          ) {
            continue;
          }
        }

        // Create discovered file using the correct interface
        const discoveredFile: DiscoveredFile = {
          s3Key: file.key,
          s3VersionId: file.versionId ?? "",
          fileSize: file.size,
          lastModified: file.lastModified,
          etag: file.etag,
          parsed: parsedFilename,
          checksum: file.checksum?.[0] ?? "",
        };

        discoveredFiles.push(discoveredFile);
      }

      return discoveredFiles;
    } catch (error) {
      throw new Error(
        `Failed to discover files: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Group files by batch ID
   * @param files - The discovered files
   * @returns The grouped files
   */
  async groupByBatch(files: DiscoveredFile[]): Promise<FileBatch[]> {
    const batchMap = new Map<string, DiscoveredFile[]>();

    // Group files by batch ID
    for (const file of files) {
      const batchId = file.parsed.batchId;
      if (!batchMap.has(batchId)) {
        batchMap.set(batchId, []);
      }
      batchMap.get(batchId)!.push(file);
    }

    // Convert to FileBatch objects
    const batches: FileBatch[] = [];
    for (const [batchId, batchFiles] of batchMap.entries()) {
      const dateExtracted = batchFiles[0].parsed.dateExtracted;
      const extractTypes = [
        ...new Set(batchFiles.map((f) => f.parsed.extractType)),
      ];
      const totalSize = batchFiles.reduce((sum, f) => sum + f.fileSize, 0);

      const batch: FileBatch = {
        dateExtracted,
        batchId,
        files: batchFiles,
        totalFiles: batchFiles.length,
        totalSize,
        extractTypes,
        isComplete: true, // We'll implement completeness check later
      };

      batches.push(batch);
    }

    // Sort batches by date extracted (newest first)
    batches.sort(
      (a, b) => b.dateExtracted.getTime() - a.dateExtracted.getTime()
    );

    return batches;
  }

  async findLatestBatch(): Promise<FileBatch | null> {
    // TODO: Implement latest batch finding
    return null;
  }

  async findBatchByDate(dateExtracted: Date): Promise<FileBatch | null> {
    // TODO: Implement batch lookup by date
    return null;
  }

  async findFilesByExtractType(extractType: string): Promise<DiscoveredFile[]> {
    // TODO: Implement extract type filtering
    return [];
  }

  async validateBatchCompleteness(batch: FileBatch): Promise<boolean> {
    // TODO: Implement batch validation
    return true;
  }
}
