/**
 * Raw Loader Service - Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { RawLoaderService } from "../raw-loader-service";
import { IdempotencyService } from "../idempotency-service";
import { ErrorHandler } from "../error-handler";
import type { FileSystemAdapter } from "../../discovery/adapters/file-system-adapter";
import type { DiscoveredFile } from "../../discovery/types/files";

// Mock implementations for testing
const mockTableLoader = {
  loadFromStream: vi.fn(),
  loadFromRows: vi.fn(),
  executeBatch: vi.fn(),
  close: vi.fn(),
};

const mockHandlerFactory = {
  getHandler: vi.fn(),
  registerHandler: vi.fn(),
  getAllHandlers: vi.fn(),
  validateHandler: vi.fn(),
};

const mockIdempotencyService = {
  checkFileProcessed: vi.fn(),
  markFileProcessing: vi.fn(),
  markFileCompleted: vi.fn(),
  markFileError: vi.fn(),
  getDuplicateFiles: vi.fn(),
  shouldSkipFile: vi.fn(),
  cleanupOldRecords: vi.fn(),
};

const mockErrorHandler = {
  handleError: vi.fn(),
  shouldRetry: vi.fn(),
  getRetryDelay: vi.fn(),
  logError: vi.fn(),
  getErrorSummary: vi.fn(),
};

const mockMonitor = {
  getMetrics: vi.fn(),
  getProgress: vi.fn(),
  getAllProgress: vi.fn(),
  updateProgress: vi.fn(),
  logMetrics: vi.fn(),
  healthCheck: vi.fn(),
  resetMetrics: vi.fn(),
  stop: vi.fn(),
  recordFileCompletion: vi.fn(),
  recordRetry: vi.fn(),
};

const mockFileSystemAdapter = {
  listFiles: vi.fn(),
  getFileStream: vi.fn(),
  getFileMetadata: vi.fn(),
  fileExists: vi.fn(),
  getFileSize: vi.fn(),
};

const mockConfig = {
  database: {
    poolSize: 10,
    timeoutMs: 30000,
    maxConnections: 20,
  },
  processing: {
    batchSize: 1000,
    maxConcurrentFiles: 5,
    maxMemoryMB: 512,
    enableStreaming: true,
    bufferSizeMB: 16,
    continueOnError: true,
  },
  csv: {
    fieldSeparator: "|^^|", // Indici field separator
    rowSeparator: "|~~|", // Indici row separator
    maxRowLength: 10000000, // Increased to handle long patient records
    maxFieldLength: 5000,
    hasHeaders: false,
    skipEmptyRows: true,
  },
  errorHandling: {
    maxRetries: 3,
    retryDelayMs: 1000,
    continueOnError: true,
    logErrors: true,
    errorThreshold: 0.1,
  },
  monitoring: {
    enableMetrics: true,
    logLevel: "info",
    metricsInterval: 30000,
    enableProgressTracking: true,
    progressUpdateInterval: 5000,
  },
};

describe("RawLoaderService", () => {
  let service: RawLoaderService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RawLoaderService(
      mockTableLoader as any,
      mockHandlerFactory as any,
      mockIdempotencyService as any,
      mockErrorHandler as any,
      mockMonitor as any,
      mockFileSystemAdapter as any,
      mockConfig
    );
  });

  describe("loadFile", () => {
    it("should successfully load a file", async () => {
      const mockFileMetadata = {
        s3Key: "test-file.csv",
        s3VersionId: "version-123",
        s3Bucket: "test-bucket",
        fileSize: 1024,
        lastModified: new Date(),
        etag: "etag-123",
        parsed: { extractType: "patients" },
        fileHash: "hash-456",
      };

      const mockIdempotencyCheck = {
        isProcessed: false,
        s3Key: mockFileMetadata.s3Key,
        s3VersionId: mockFileMetadata.s3VersionId,
        fileHash: mockFileMetadata.fileHash,
        extractType: "patients",
      };

      const mockHandler = {
        extractType: "patients",
        tableName: "raw.patients",
        columnMapping: ["patient_id", "name"],
        validationRules: [],
      };

      const mockLoadResult = {
        totalRows: 100,
        successfulBatches: 1,
        failedBatches: 0,
        errors: [],
        warnings: [],
        durationMs: 5000,
        bytesProcessed: 10240,
        rowsPerSecond: 20,
        memoryUsageMB: 50,
      };

      mockIdempotencyService.checkFileProcessed.mockResolvedValue(
        mockIdempotencyCheck
      );
      mockIdempotencyService.markFileProcessing.mockResolvedValue(
        "load-run-file-id-123"
      );
      mockHandlerFactory.getHandler.mockResolvedValue(mockHandler);
      mockTableLoader.loadFromStream.mockResolvedValue(mockLoadResult);
      mockIdempotencyService.markFileCompleted.mockResolvedValue(undefined);

      // Mock the private getFileStream method
      const mockStream = {
        on: vi.fn(),
        pipe: vi.fn(),
        destroy: vi.fn(),
      };
      mockFileSystemAdapter.getFileStream.mockResolvedValue(mockStream as any);

      // Make sure buildLoadOptions returns the expected options
      const mockLoadOptions = {
        extractType: "",
        batchSize: mockConfig.processing.batchSize,
        maxRetries: mockConfig.errorHandling.maxRetries,
        continueOnError: mockConfig.errorHandling.continueOnError,
        validateRowCount: true,
        skipValidation: false,
      };
      vi.spyOn(service as any, "buildLoadOptions").mockReturnValue(
        mockLoadOptions
      );

      const result = await service.loadFile(
        mockFileMetadata as DiscoveredFile,
        "run-123"
      );

      // Check that all mocks were called
      expect(mockIdempotencyService.checkFileProcessed).toHaveBeenCalledWith(
        mockFileMetadata
      );
      expect(mockIdempotencyService.markFileProcessing).toHaveBeenCalledWith(
        mockFileMetadata,
        "run-123"
      );
      expect(mockHandlerFactory.getHandler).toHaveBeenCalledWith("patients");
      expect(mockFileSystemAdapter.getFileStream).toHaveBeenCalledWith(
        mockFileMetadata.s3Key
      );
      expect(mockTableLoader.loadFromStream).toHaveBeenCalled();
      expect(mockIdempotencyService.markFileCompleted).toHaveBeenCalledWith(
        mockFileMetadata,
        "run-123",
        100
      );

      // Check the result
      expect(result).toStrictEqual(mockLoadResult);
    });

    it("should skip already processed files", async () => {
      const mockFileMetadata = {
        s3Key: "test-file.csv",
        s3VersionId: "version-123",
        s3Bucket: "test-bucket",
        fileSize: 1024,
        lastModified: new Date(),
        etag: "etag-123",
        parsed: { extractType: "patients" },
        fileHash: "hash-456",
      };

      const mockIdempotencyCheck = {
        isProcessed: true,
        s3Key: mockFileMetadata.s3Key,
        s3VersionId: mockFileMetadata.s3VersionId,
        fileHash: mockFileMetadata.fileHash,
        extractType: "patients",
        rowCount: 50,
        loadRunId: "previous-run-123",
      };

      mockIdempotencyService.checkFileProcessed.mockResolvedValue(
        mockIdempotencyCheck
      );

      const result = await service.loadFile(
        mockFileMetadata as DiscoveredFile,
        "run-123"
      );

      expect(result.totalRows).toBe(50);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].message).toContain("already processed");
      expect(mockTableLoader.loadFromStream).not.toHaveBeenCalled();
      expect(mockIdempotencyService.markFileCompleted).not.toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      const mockFileMetadata = {
        s3Key: "test-file.csv",
        s3VersionId: "version-123",
        s3Bucket: "test-bucket",
        fileSize: 1024,
        lastModified: new Date(),
        etag: "etag-123",
        parsed: { extractType: "patients" },
        fileHash: "hash-456",
      };

      const mockError = new Error("Database connection failed");
      const mockLoadError = {
        errorType: "DATABASE_ERROR",
        message: "Database connection failed",
        timestamp: new Date(),
        isRetryable: true,
        context: { operation: "loadFile" },
      };

      const mockIdempotencyCheck = {
        isProcessed: false,
        s3Key: mockFileMetadata.s3Key,
        s3VersionId: mockFileMetadata.s3VersionId,
        fileHash: mockFileMetadata.fileHash,
        extractType: "patients",
      };

      mockIdempotencyService.checkFileProcessed.mockResolvedValue(
        mockIdempotencyCheck
      );
      mockIdempotencyService.markFileProcessing.mockResolvedValue(
        "load-run-file-id-123"
      );
      mockHandlerFactory.getHandler.mockRejectedValue(mockError);
      mockErrorHandler.handleError.mockResolvedValue(mockLoadError);
      mockIdempotencyService.markFileError.mockResolvedValue(undefined);

      const result = await service.loadFile(
        mockFileMetadata as DiscoveredFile,
        "run-123"
      );

      expect(result.totalRows).toBe(0);
      expect(result.failedBatches).toBe(1);
      expect(result.errors).toContain(mockLoadError);
      expect(mockIdempotencyService.markFileError).toHaveBeenCalledWith(
        mockFileMetadata,
        "run-123",
        mockLoadError.message
      );
    });
  });

  describe("loadMultipleFiles", () => {
    it("should load multiple files concurrently", async () => {
      const mockFiles = [
        {
          s3Key: "file1.csv",
          s3VersionId: "v1",
          s3Bucket: "test-bucket",
          fileSize: 1024,
          lastModified: new Date(),
          etag: "etag-1",
          parsed: { extractType: "patients" },
          fileHash: "h1",
        },
        {
          s3Key: "file2.csv",
          s3VersionId: "v2",
          s3Bucket: "test-bucket",
          fileSize: 2048,
          lastModified: new Date(),
          etag: "etag-2",
          parsed: { extractType: "appointments" },
          fileHash: "h2",
        },
      ];

      const mockResults = [
        { totalRows: 100, successfulBatches: 1, failedBatches: 0, errors: [] },
        { totalRows: 50, successfulBatches: 1, failedBatches: 0, errors: [] },
      ];

      // Mock individual file loading
      const loadFileSpy = vi
        .fn()
        .mockResolvedValueOnce(mockResults[0])
        .mockResolvedValueOnce(mockResults[1]);
      service.loadFile = loadFileSpy;

      const results = await service.loadMultipleFiles(
        mockFiles as DiscoveredFile[],
        "run-123"
      );

      expect(results).toHaveLength(2);
      expect(results[0].totalRows).toBe(100);
      expect(results[1].totalRows).toBe(50);
      expect(loadFileSpy).toHaveBeenCalledTimes(2);
      expect(loadFileSpy).toHaveBeenCalledWith(
        mockFiles[0],
        "run-123",
        expect.any(Object)
      );
      expect(loadFileSpy).toHaveBeenCalledWith(
        mockFiles[1],
        "run-123",
        expect.any(Object)
      );
    });
  });

  describe("getLoadProgress", () => {
    it("should return progress for a file", async () => {
      const mockProgress = {
        fileKey: "test-file.csv",
        extractType: "patients",
        totalRows: 1000,
        processedRows: 500,
        currentBatch: 1,
        totalBatches: 2,
        estimatedTimeRemaining: 30000,
        currentStatus: "PROCESSING" as const,
        errors: [],
        warnings: [],
        bytesProcessed: 5120,
        memoryUsageMB: 50,
        startTime: new Date(),
        lastUpdate: new Date(),
      };

      mockMonitor.getProgress.mockResolvedValue(mockProgress);

      const progress = await service.getLoadProgress("test-file.csv");

      expect(progress).toBe(mockProgress);
      expect(mockMonitor.getProgress).toHaveBeenCalledWith("test-file.csv");
    });

    it("should return default progress when not found", async () => {
      mockMonitor.getProgress.mockResolvedValue(null);

      const progress = await service.getLoadProgress("nonexistent-file.csv");

      expect(progress.fileKey).toBe("nonexistent-file.csv");
      expect(progress.currentStatus).toBe("PENDING");
      expect(progress.totalRows).toBe(0);
      expect(mockMonitor.getProgress).toHaveBeenCalledWith(
        "nonexistent-file.csv"
      );
    });
  });

  describe("getErrorSummary", () => {
    it("should return error summary", async () => {
      const mockErrors = [
        {
          errorType: "DATABASE_ERROR",
          message: "Connection failed",
          isRetryable: true,
        },
        {
          errorType: "VALIDATION_ERROR",
          message: "Invalid data",
          isRetryable: false,
        },
      ];

      const mockSummary = {
        errorsByType: { DATABASE_ERROR: 1, VALIDATION_ERROR: 1 },
        topErrors: mockErrors,
      };

      mockErrorHandler.getErrorSummary.mockResolvedValue(mockSummary);

      const summary = await service.getErrorSummary(mockErrors);

      expect(summary.totalErrors).toBe(2);
      expect(summary.errorsByType).toEqual({
        DATABASE_ERROR: 1,
        VALIDATION_ERROR: 1,
      });
      expect(summary.retryableErrors).toBe(1);
      expect(summary.blockingErrors).toBe(1);
      expect(mockErrorHandler.getErrorSummary).toHaveBeenCalledWith(mockErrors);
    });
  });

  describe("healthCheck", () => {
    it("should return true when healthy", async () => {
      mockMonitor.healthCheck.mockResolvedValue(true);

      const isHealthy = await service.healthCheck();

      expect(isHealthy).toBe(true);
      expect(mockMonitor.healthCheck).toHaveBeenCalled();
    });

    it("should return false when monitor is unhealthy", async () => {
      mockMonitor.healthCheck.mockResolvedValue(false);

      const isHealthy = await service.healthCheck();

      expect(isHealthy).toBe(false);
      expect(mockMonitor.healthCheck).toHaveBeenCalled();
    });

    it("should return false when monitor throws error", async () => {
      mockMonitor.healthCheck.mockRejectedValue(new Error("Monitor error"));

      const isHealthy = await service.healthCheck();

      expect(isHealthy).toBe(false);
    });
  });
});
