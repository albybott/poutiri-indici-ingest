import "dotenv/config";
import { randomUUID } from "crypto";
import { S3DiscoveryService } from "./services/discovery";
import { RawLoaderContainer, type LoadResult } from "./services/raw-loader";
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
        // A processing plan is a structured plan that organizes discovered files into batches for processing.
        // It contains:
        // - batches: Array of FileBatch objects, each containing files from the same extraction date
        // - totalFiles: Total count of files across all batches
        // - estimatedDuration: Estimated processing time in seconds
        // - dependencies: Extract type dependencies (e.g., Patients before Appointments)
        // - processingOrder: Optimized order for processing files
        // - warnings: Non-critical issues found during discovery
        const processingPlan = await discoveryService.discoverLatestFiles({
          extractTypes: ["Patient"],
          // Remove maxBatches limit to process all available batches
        });

        if (processingPlan.batches.length > 0) {
          console.log(
            `📁 Found ${processingPlan.batches.length} batches with ${processingPlan.totalFiles} total files`
          );

          // Process all batches
          const allLoadResults = [];
          let totalBatchesProcessed = 0;
          let totalFilesProcessed = 0;

          for (
            let batchIndex = 0;
            batchIndex < processingPlan.batches.length;
            batchIndex++
          ) {
            const batch = processingPlan.batches[batchIndex];

            if (batch.files.length === 0) {
              console.log(`⚠️  Batch ${batchIndex + 1} has no files, skipping`);
              continue;
            }

            console.log(
              `📦 Processing batch ${batchIndex + 1}/${processingPlan.batches.length} with ${batch.files.length} files`
            );

            const loadRunId = randomUUID();
            console.log(
              `🏃 Starting load run: ${loadRunId} for batch ${batchIndex + 1}`
            );

            const loadResults: LoadResult[] = [];

            for (const file of batch.files) {
              console.log(`📦 Processing file: ${file.s3Key}`);

              const loadResult = await rawLoader.loadFile(file, loadRunId, {
                batchSize: 500,
                continueOnError: true,
                maxConcurrentFiles: 1,
              });

              loadResults.push(loadResult);
            }

            // Load the files for this batch into the database using the raw loader service
            // const loadResults = await rawLoader.loadMultipleFiles(
            //   batch.files,
            //   loadRunId,
            //   {
            //     batchSize: 500,
            //     continueOnError: true,
            //     maxConcurrentFiles: 1,
            //   }
            // );

            allLoadResults.push(...loadResults);
            totalBatchesProcessed++;
            totalFilesProcessed += loadResults.length;

            console.log(`✅ Batch ${batchIndex + 1} completed!`, {
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
          }

          // Overall summary
          console.log("🎉 All batches processing completed!", {
            batchesProcessed: totalBatchesProcessed,
            totalFilesProcessed,
            totalRows: allLoadResults.reduce((sum, r) => sum + r.totalRows, 0),
            totalSuccessfulBatches: allLoadResults.reduce(
              (sum, r) => sum + r.successfulBatches,
              0
            ),
            totalFailedBatches: allLoadResults.reduce(
              (sum, r) => sum + r.failedBatches,
              0
            ),
            totalErrors: allLoadResults.reduce(
              (sum, r) => sum + r.errors.length,
              0
            ),
          });

          // Show detailed results for the first file across all batches
          if (allLoadResults.length > 0) {
            const firstResult = allLoadResults[0];
            console.log("📊 Sample file details:", {
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
          console.log("⚠️  No batches found in the processing plan");
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
