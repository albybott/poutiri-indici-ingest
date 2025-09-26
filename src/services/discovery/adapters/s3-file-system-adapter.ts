/**
 * S3 File System Adapter Implementation
 * Provides S3-specific implementation of FileSystemAdapter
 */

import {
  S3Client,
  ListObjectsV2Command,
  HeadObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import type { FileSystemAdapter, FileMetadata } from "./file-system-adapter";
import type { S3Config } from "../types/config";

export class S3FileSystemAdapter implements FileSystemAdapter {
  private s3Client: S3Client;
  private config: S3Config;

  constructor(s3Client: S3Client, config: S3Config) {
    this.s3Client = s3Client;
    this.config = config;
  }

  async listFiles(prefix?: string): Promise<FileMetadata[]> {
    const files: FileMetadata[] = [];
    let continuationToken: string | undefined;
    const maxKeys = this.config.maxKeys || 1000;

    try {
      do {
        const command = new ListObjectsV2Command({
          Bucket: this.config.bucket,
          Prefix: prefix || this.config.prefix,
          MaxKeys: maxKeys,
          ContinuationToken: continuationToken,
        });

        const response = await this.s3Client.send(command);

        if (response.Contents) {
          for (const object of response.Contents) {
            if (object.Key) {
              files.push({
                key: object.Key || "",
                size: object.Size || 0,
                lastModified: object.LastModified || new Date(),
                etag: object.ETag || "",
                versionId: (object as any).VersionId,
                checksumAlgorithm: (object as any).ChecksumAlgorithm,
                checksum: (object as any).Checksum,
              });
            }
          }
        }

        continuationToken = response.NextContinuationToken;
      } while (continuationToken);

      return files;
    } catch (error) {
      throw new Error(
        `Failed to list files from S3: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async getFileStream(key: string): Promise<NodeJS.ReadableStream> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      if (!response.Body) {
        throw new Error(`No body returned for key: ${key}`);
      }

      return response.Body as NodeJS.ReadableStream;
    } catch (error) {
      throw new Error(
        `Failed to get file stream from S3: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async getFileMetadata(key: string): Promise<FileMetadata> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      return {
        key,
        size: response.ContentLength || 0,
        lastModified: response.LastModified || new Date(),
        etag: response.ETag || "",
        versionId: response.VersionId,
        checksumAlgorithm: (response as any).ChecksumAlgorithm,
        checksum: (response as any).Checksum,
      };
    } catch (error) {
      throw new Error(
        `Failed to get file metadata from S3: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      await this.getFileMetadata(key);
      return true;
    } catch (error) {
      // If it's a "NotFound" error, return false, otherwise rethrow
      if (error instanceof Error && error.message.includes("NotFound")) {
        return false;
      }
      throw error;
    }
  }

  async getFileSize(key: string): Promise<number> {
    const metadata = await this.getFileMetadata(key);
    return metadata.size;
  }
}
