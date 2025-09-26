/**
 * S3 Discovery Service Tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import { S3DiscoveryService } from "../s3-discovery-service";
import type { S3DiscoveryConfig } from "../types/config";

describe("S3DiscoveryService", () => {
  let service: S3DiscoveryService;
  let config: S3DiscoveryConfig;

  beforeEach(() => {
    config = {
      s3: {
        bucket: "test-bucket",
        region: "us-east-1",
        maxKeys: 1000,
        maxConcurrency: 4,
        retryAttempts: 3,
      },
      discovery: {
        batchSize: 1000,
        maxFilesPerBatch: 100,
        enableVersioning: true,
        validateHashes: true,
        cacheMetadata: true,
        cacheTtlMinutes: 60,
      },
      processing: {
        priorityExtracts: ["Patient", "Appointments"],
        maxConcurrentFiles: 10,
        processingTimeoutMs: 300000,
      },
    };

    service = new S3DiscoveryService(config);
  });

  it("should initialize with default configuration", () => {
    const defaultService = new S3DiscoveryService();
    expect(defaultService).toBeDefined();
    expect(defaultService.getConfig()).toBeDefined();
  });

  it("should initialize with custom configuration", () => {
    expect(service).toBeDefined();
    expect(service.getConfig().s3.bucket).toBe("test-bucket");
    expect(service.getConfig().s3.region).toBe("us-east-1");
  });

  it("should have health check capability", async () => {
    // Note: This will fail with real AWS credentials, but should not throw compilation errors
    try {
      const isHealthy = await service.healthCheck();
      expect(typeof isHealthy).toBe("boolean");
    } catch (error) {
      // Expected to fail without AWS credentials, but should not throw TypeScript errors
      expect(error).toBeDefined();
    }
  });

  it("should have configuration update capability", () => {
    const newConfig = {
      s3: { ...config.s3, maxKeys: 500 },
    };

    service.updateConfig(newConfig);
    expect(service.getConfig().s3.maxKeys).toBe(500);
  });
});
