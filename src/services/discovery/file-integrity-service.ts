/**
 * File Integrity Service
 * Handles file hashing and integrity validation
 */

import { createHash } from "node:crypto";
import type { FileSystemAdapter } from "./adapters/file-system-adapter";
import type { DiscoveredFile } from "./types/files";

export interface FileIntegrity {
  s3VersionId: string;
  etag: string; // S3 ETag for quick comparison
  fileHash?: string; // SHA-256 hash for content integrity
  fileSize: number;
  checksumValidated: boolean;
  lastChecked: Date;
  checksumAlgorithm?: string; // S3 checksum algorithm (SHA256, SHA1, etc.)
}

export class FileIntegrityService {
  constructor(private fileSystemAdapter: FileSystemAdapter) {}

  async calculateHash(stream: NodeJS.ReadableStream): Promise<string> {
    const hash = createHash("sha256");
    for await (const chunk of stream) {
      hash.update(chunk);
    }
    return hash.digest("hex");
  }

  async validateIntegrity(
    file: DiscoveredFile,
    contentStream: NodeJS.ReadableStream
  ): Promise<boolean> {
    if (!file.fileHash) {
      return true; // No hash to validate against
    }

    const calculatedHash = await this.calculateHash(contentStream);
    return calculatedHash === file.fileHash;
  }

  async getFileMetadata(s3Key: string): Promise<FileIntegrity> {
    const metadata = await this.fileSystemAdapter.getFileMetadata(s3Key);

    return {
      s3VersionId: metadata.versionId || "",
      etag: metadata.etag,
      fileSize: metadata.size,
      checksumValidated: false,
      lastChecked: new Date(),
      checksumAlgorithm: metadata.checksumAlgorithm?.[0],
    };
  }

  async compareVersions(
    file1: DiscoveredFile,
    file2: DiscoveredFile
  ): Promise<boolean> {
    return file1.s3VersionId === file2.s3VersionId || file1.etag === file2.etag;
  }
}
