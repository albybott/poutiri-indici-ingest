/**
 * S3 Discovery Service - Main Service Class
 * Orchestrates file discovery, parsing, and batching from S3
 */

import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import {
  fromEnv,
  fromIni,
  fromInstanceMetadata,
} from "@aws-sdk/credential-providers";
import { S3FileSystemAdapter } from "./adapters/s3-file-system-adapter";
import { FileIntegrityService } from "./file-integrity-service";
import { FilenameParser } from "./filename-parser";
import { FileDiscovery } from "./file-discovery";
import { BatchProcessor } from "./batch-processor";
import { DiscoveryMonitor } from "./discovery-monitor";
import type { S3DiscoveryConfig, ExtractType } from "./types/config";
import { DEFAULT_CONFIG } from "./types/config";
import type { ProcessingPlan } from "./types/discovery";
import type { FileBatch } from "./types/files";

export class S3DiscoveryService {
  private config: S3DiscoveryConfig;
  private s3Client: S3Client;
  private fileSystemAdapter: S3FileSystemAdapter;
  private filenameParser: FilenameParser;
  private fileDiscovery: FileDiscovery;
  private batchProcessor: BatchProcessor;
  private integrityService: FileIntegrityService;
  private monitor: DiscoveryMonitor;

  constructor(config: Partial<S3DiscoveryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Initialize AWS S3 Client with proper credential management
    this.s3Client = new S3Client({
      region: this.config.s3.region,
      credentials: this.getCredentialProvider(),
      maxAttempts: this.config.s3.retryAttempts || 3,
    });

    // Initialize adapter
    this.fileSystemAdapter = new S3FileSystemAdapter(
      this.s3Client,
      this.config.s3
    );

    // Initialize core services
    this.filenameParser = new FilenameParser();
    this.fileDiscovery = new FileDiscovery(
      this.fileSystemAdapter,
      this.filenameParser
    );
    this.batchProcessor = new BatchProcessor(this.fileDiscovery);
    this.integrityService = new FileIntegrityService(this.fileSystemAdapter);
    this.monitor = new DiscoveryMonitor();
  }

  /**
   * Determine the appropriate credential provider based on environment
   */
  private getCredentialProvider() {
    // Try environment variables first
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      return fromEnv();
    }

    // Try AWS profile
    if (process.env.AWS_PROFILE) {
      return fromIni({ profile: process.env.AWS_PROFILE });
    }

    // Try EC2/ECS instance metadata (for production)
    try {
      return fromInstanceMetadata();
    } catch {
      // Fall back to environment variables
      return fromEnv();
    }
  }

  /**
   * Discover the latest files available in S3
   */
  async discoverLatestFiles(options?: {
    extractTypes?: ExtractType[];
    maxBatches?: number;
  }): Promise<ProcessingPlan> {
    const startTime = Date.now();
    this.monitor.logDiscoveryStart(options);

    try {
      const files = await this.fileDiscovery.discoverFiles(options);
      const batches = await this.fileDiscovery.groupByBatch(files);
      const processingPlan = await this.batchProcessor.createProcessingPlan({
        mode: "latest",
        extractTypes: options?.extractTypes,
        maxBatches: options?.maxBatches,
      });

      const duration = Date.now() - startTime;
      this.monitor.logDiscoveryComplete({
        filesDiscovered: files.length,
        batchesFound: batches.length,
        totalSizeBytes: files.reduce((sum, f) => sum + f.fileSize, 0),
        discoveryDurationMs: duration,
        errorsEncountered: 0,
        s3ApiCalls: 1, // TODO: Track actual API calls
        cacheHitRate: 0, // TODO: Implement caching metrics
      });

      return processingPlan;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.monitor.logError({
        type: "S3_CONNECTION",
        message: error instanceof Error ? error.message : "Unknown error",
        retryable: true,
        timestamp: new Date(),
      });

      throw error;
    }
  }

  /**
   * Discover files within a specific date range
   */
  async discoverByDateRange(from: Date, to: Date): Promise<ProcessingPlan> {
    return this.batchProcessor.createProcessingPlan({
      mode: "backfill",
      dateRange: { from, to },
    });
  }

  /**
   * Discover a specific batch by date extracted
   */
  async discoverSpecificBatch(batchId: string): Promise<FileBatch | null> {
    return this.fileDiscovery.findBatchByDate(this.parseBatchIdToDate(batchId));
  }

  /**
   * Get current discovery status and health information
   */
  async getDiscoveryStatus() {
    return this.monitor.getStatus();
  }

  /**
   * Parse batch ID back to Date object
   */
  private parseBatchIdToDate(batchId: string): Date {
    // Assuming batchId format is YYMMDDHHMM
    // This should be implemented based on your specific format
    return new Date(); // Placeholder
  }

  /**
   * Validate service connectivity and configuration
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Test basic S3 connectivity
      await this.s3Client.send(
        new ListObjectsV2Command({
          Bucket: this.config.s3.bucket,
          MaxKeys: 1,
        })
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get service configuration
   */
  getConfig(): S3DiscoveryConfig {
    return { ...this.config };
  }

  /**
   * Update service configuration at runtime
   */
  updateConfig(newConfig: Partial<S3DiscoveryConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}
