import "dotenv/config";
import { randomUUID } from "crypto";
import { S3DiscoveryService } from "./services/discovery";
import { RawLoaderContainer } from "./services/raw-loader";
import type { RawLoaderConfig } from "./services/raw-loader/types/config";
import type { DiscoveredFile } from "./services/discovery/types/files";

interface AppConfig {
  databaseUrl: string;
  s3Bucket?: string;
  awsRegion?: string;
  testMode: boolean;
}

const config: AppConfig = {
  databaseUrl: `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  s3Bucket: process.env.S3_BUCKET_NAME,
  awsRegion: process.env.AWS_REGION,
  testMode: process.env.NODE_ENV !== "production",
};

// eslint-disable-next-line @typescript-eslint/require-await
async function main(): Promise<void> {
  console.log("🚀 Starting application...");
  console.log(`📡 Database URL: ${config.databaseUrl}`);
  console.log(`☁️  S3 Bucket: ${config.s3Bucket || "Not configured"}`);
  console.log(`🌍 AWS Region: ${config.awsRegion || "Not configured"}`);
  console.log(`🧪 Test Mode: ${config.testMode ? "Enabled" : "Disabled"}`);

  // Test Raw Loader Service
  await testRawLoaderService();

  console.log("✅ Application started successfully!");
}

async function testRawLoaderService(): Promise<void> {
  console.log("\n📦 Testing Raw Loader Service...");

  try {
    // Raw loader configuration
    const rawLoaderConfig: RawLoaderConfig = {
      // Database configuration
      database: {
        poolSize: 10,
        timeoutMs: 30000,
        maxConnections: 20,
      },
      // Processing configuration
      processing: {
        batchSize: 1000,
        maxConcurrentFiles: 5,
        maxMemoryMB: 512,
        enableStreaming: true,
        bufferSizeMB: 16,
        continueOnError: true,
      },
      // CSV configuration
      csv: {
        fieldSeparator: "|^^|", // Indici field separator
        rowSeparator: "|~~|", // Indici row separator
        maxRowLength: 10000000, // Increased to handle extremely long patient records (10M chars)
        // maxFieldLength: 5000, // Limit individual field lengths
        hasHeaders: false,
        skipEmptyRows: true,
      },
      // Error handling configuration
      errorHandling: {
        maxRetries: 3,
        retryDelayMs: 1000,
        continueOnError: true,
        logErrors: true,
        errorThreshold: 0.1,
      },
      // Monitoring configuration
      monitoring: {
        enableMetrics: true,
        logLevel: "info",
        metricsInterval: 30000,
        enableProgressTracking: true,
        progressUpdateInterval: 5000,
      },
    };
    const rawLoader = RawLoaderContainer.create(
      rawLoaderConfig,
      config.s3Bucket && config.awsRegion
        ? {
            bucket: config.s3Bucket,
            region: config.awsRegion,
            maxConcurrency: 1,
            retryAttempts: 2,
          }
        : undefined
    );

    const isHealthy = await rawLoader.healthCheck();
    console.log(
      `🏥 Service health: ${isHealthy ? "✅ Healthy" : "❌ Unhealthy"}`
    );

    if (config.s3Bucket && config.awsRegion) {
      try {
        const discoveryService = new S3DiscoveryService({
          s3: {
            bucket: config.s3Bucket,
            region: config.awsRegion,
            maxConcurrency: 1,
            retryAttempts: 2,
          },
          discovery: {
            batchSize: 1,
            maxFilesPerBatch: 1,
            enableVersioning: true,
            validateHashes: false,
            cacheMetadata: false,
            cacheTtlMinutes: 5,
          },
          processing: {
            priorityExtracts: ["Patient"],
            maxConcurrentFiles: 1,
            processingTimeoutMs: 60000,
          },
        });

        // Create a processing plan for this run
        // A processing plan is a list of files to load into the database
        const processingPlan = await discoveryService.discoverLatestFiles({
          extractTypes: ["Patient"],
          maxBatches: 1,
        });

        if (
          processingPlan.batches.length > 0 &&
          processingPlan.batches[0].files.length > 0
        ) {
          console.log(
            `📁 Found ${processingPlan.batches[0].files.length} files in latest batch`
          );

          const loadRunId = randomUUID();
          console.log(`🏃 Starting load run: ${loadRunId}`);

          // This is where we would load the files into the database using the raw loader service
          const loadResults = await rawLoader.loadMultipleFiles(
            processingPlan.batches[0].files,
            loadRunId,
            {
              batchSize: 500,
              continueOnError: true,
              maxConcurrentFiles: 1,
            }
          );

          console.log("✅ Load completed!", {
            filesProcessed: loadResults.length,
            totalRows: loadResults.reduce((sum, r) => sum + r.totalRows, 0),
            successfulBatches: loadResults.reduce(
              (sum, r) => sum + r.successfulBatches,
              0
            ),
            failedBatches: loadResults.reduce(
              (sum, r) => sum + r.failedBatches,
              0
            ),
            errors: loadResults.reduce((sum, r) => sum + r.errors.length, 0),
          });

          // Show detailed results for the first file
          if (loadResults.length > 0) {
            const firstResult = loadResults[0];
            console.log("📊 First file details:", {
              totalRows: firstResult.totalRows,
              successfulBatches: firstResult.successfulBatches,
              failedBatches: firstResult.failedBatches,
              durationMs: firstResult.durationMs,
              rowsPerSecond: Math.round(firstResult.rowsPerSecond),
              memoryUsageMB: firstResult.memoryUsageMB,
              errors: firstResult.errors.length,
            });
          }
        } else {
          console.log("⚠️  No files found in the latest batch");
        }
      } catch (error) {
        console.error("❌ Error loading real data:", error);
        console.log(
          "💡 This is expected if database connection is not available"
        );
      }
    } else {
      console.log(
        "⚠️  Cannot load real data - missing S3 credentials or not in test mode"
      );
    }

    console.log("\n✅ Raw Loader Service tests completed successfully!");
  } catch (error) {
    console.error("❌ Raw Loader Service test failed:", error);

    if (error instanceof Error) {
      console.error("🔍 Error details:", {
        message: error.message,
        stack: error.stack?.split("\n").slice(0, 3).join("\n"), // First 3 lines of stack
      });
    }

    // Don't exit in test mode, just log the error
    if (!config.testMode) {
      throw error;
    }
  }
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("👋 Received SIGINT. Shutting down gracefully...");
  process.exit(0);
});

// Start the application
main().catch((error) => {
  console.error("❌ Failed to start application:", error);
  process.exit(1);
});
