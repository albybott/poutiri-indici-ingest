import { S3Client } from "@aws-sdk/client-s3";
import {
  fromEnv,
  fromIni,
  fromInstanceMetadata,
} from "@aws-sdk/credential-providers";
import type { S3Config } from "../../services/discovery/types/config";
import { S3FileSystemAdapter } from "../../services/discovery/adapters/s3-file-system-adapter";
import type { RawLoaderConfig } from "./types/config";
import { ErrorHandler } from "./error-handler";
import { LoadMonitor } from "./load-monitor";
import { RawTableLoader } from "./raw-table-loader";
import { ExtractHandlerFactory } from "./extract-handler-factory";
import { IdempotencyService } from "./idempotency-service";
import { RawLoaderService } from "./raw-loader-service";

/**
 * Raw Loader Factory - Dependency Injection Factory
 * Creates and wires up all Raw Loader dependencies with proper configuration
 */
export class RawLoaderFactory {
  static create(
    config: RawLoaderConfig,
    s3Config?: S3Config
  ): RawLoaderService {
    // Create S3 client and adapter if S3 config is provided
    let fileSystemAdapter: S3FileSystemAdapter;

    if (s3Config) {
      // Initialize AWS S3 Client with proper credential management
      const s3Client = new S3Client({
        region: s3Config.region,
        credentials: this.getCredentialProvider(),
        maxAttempts: s3Config.retryAttempts || 3,
      });

      // Create S3 file system adapter
      fileSystemAdapter = new S3FileSystemAdapter(s3Client, s3Config);
    } else {
      throw new Error("S3 configuration is required for RawLoaderService");
    }

    const errorHandler = new ErrorHandler(config.errorHandling);
    const monitor = new LoadMonitor(config.monitoring);
    const tableLoader = new RawTableLoader(config.database, errorHandler);
    const handlerFactory = new ExtractHandlerFactory();
    const idempotencyService = new IdempotencyService();

    return new RawLoaderService(
      tableLoader,
      handlerFactory,
      idempotencyService,
      errorHandler,
      monitor,
      fileSystemAdapter,
      config
    );
  }

  /**
   * Determine the appropriate credential provider based on environment
   */
  private static getCredentialProvider() {
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
}
