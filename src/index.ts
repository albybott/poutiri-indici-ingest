import "dotenv/config";
import { S3DiscoveryService } from "./services/discovery/index.js";
import {
  RawLoaderFactory,
  type LoadResult,
} from "./services/raw-loader/index.js";
import type { RawLoaderConfig } from "./services/raw-loader/types/config.js";
import type { DiscoveredFile } from "./services/discovery/types/files.js";
import {
  StagingTransformerContainer,
  ColumnType,
  ValidationRuleBuilders,
  type StagingExtractHandler,
} from "@/services/staging-transformer/index.js";
import { LoadRunService } from "@/services/raw-loader/load-run-service.js";

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

function init(): void {
  console.log("🚀 Starting application...");
  console.log(`📡 Database URL: ${config.databaseUrl}`);
  console.log(`☁️  S3 Bucket: ${config.s3Bucket || "Not configured"}`);
  console.log(`🌍 AWS Region: ${config.awsRegion || "Not configured"}`);
  console.log(`🧪 Test Mode: ${config.testMode ? "Enabled" : "Disabled"}`);
}

async function testRawLoaderService(): Promise<string | null> {
  let loadRunId: string | null = null;
  const loadRunService = new LoadRunService();

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

    const rawLoader = RawLoaderFactory.create(
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

          // Create a single load run for this entire execution
          loadRunId = await loadRunService.createLoadRun({
            triggeredBy: "manual",
            notes: `Processing ${processingPlan.totalFiles} Patient files across ${processingPlan.batches.length} batches`,
          });
          console.log(`🏃 Created load run: ${loadRunId}`);

          // Process all batches with the same load run ID
          const allLoadResults = [];
          let totalBatchesProcessed = 0;
          let totalFilesProcessed = 0;
          let totalRowsIngested = 0;
          let totalRowsRejected = 0;

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

            // Load the files for this batch into the database using the raw loader service
            const loadResults = await rawLoader.loadMultipleFiles(
              batch.files,
              loadRunId,
              {
                batchSize: 500,
                continueOnError: true,
                maxConcurrentFiles: 1,
              }
            );

            allLoadResults.push(...loadResults);
            totalBatchesProcessed++;
            totalFilesProcessed += loadResults.length;
            totalRowsIngested += loadResults.reduce(
              (sum, r) => sum + r.totalRows,
              0
            );
            // Note: We don't have rejected rows count from LoadResult, tracking at 0 for now
            totalRowsRejected += 0;

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

          // Update load run with final statistics
          await loadRunService.completeLoadRun(loadRunId, {
            totalFilesProcessed,
            totalRowsIngested,
            totalRowsRejected,
          });

          // Overall summary
          console.log("🎉 All batches processing completed!", {
            loadRunId,
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

          console.log("\n✅ Raw Loader Service tests completed successfully!");
          console.log(`📋 Load run ${loadRunId} completed`);
          return loadRunId;
        } else {
          console.log("⚠️  No batches found in the processing plan");
          return null;
        }
      } catch (error) {
        console.error("❌ Error loading real data:", error);
        console.log(
          "💡 This is expected if database connection is not available"
        );

        // Mark load run as failed if it was created
        if (loadRunId) {
          await loadRunService.failLoadRun(
            loadRunId,
            error instanceof Error ? error.message : String(error)
          );
        }

        return null;
      }
    } else {
      console.log(
        "⚠️  Cannot load real data - missing S3 credentials or not in test mode"
      );
      console.log("\n✅ Raw Loader Service tests skipped");
      return null;
    }
  } catch (error) {
    console.error("❌ Raw Loader Service test failed:", error);

    if (error instanceof Error) {
      console.error("🔍 Error details:", {
        message: error.message,
        stack: error.stack?.split("\n").slice(0, 3).join("\n"), // First 3 lines of stack
      });
    }

    // Mark load run as failed if it was created
    if (loadRunId) {
      await loadRunService.failLoadRun(
        loadRunId,
        error instanceof Error ? error.message : String(error)
      );
    }

    // Don't exit in test mode, just log the error
    if (!config.testMode) {
      throw error;
    }
    return null;
  }
}

async function testStagingTransformerService(loadRunId: string): Promise<void> {
  console.log(
    "\n🔄 Testing Staging Transformer Service (raw.* → stg.* tables)..."
  );

  try {
    // Create staging transformer
    const transformer = StagingTransformerContainer.create({
      transformation: {
        batchSize: 1000,
        maxConcurrentTransforms: 3,
        enableTypeCoercion: true,
        dateFormat: "YYYY-MM-DD",
        timestampFormat: "YYYY-MM-DD HH:mm:ss",
        decimalPrecision: 2,
        trimStrings: true,
        nullifyEmptyStrings: true,
      },
      validation: {
        enableValidation: true,
        failOnValidationError: false,
        maxErrorsPerBatch: 100,
        maxTotalErrors: 1000,
        rejectInvalidRows: true,
        trackRejectionReasons: true,
      },
      errorHandling: {
        continueOnError: true,
        maxRetries: 3,
        retryDelayMs: 1000,
        captureRawRow: true,
        enableDetailedLogging: true,
      },
    });

    // Health check
    const isHealthy = await transformer.healthCheck();
    console.log(
      `🏥 Staging Transformer health: ${isHealthy ? "✅ Healthy" : "❌ Unhealthy"}`
    );

    if (!isHealthy) {
      console.log("⚠️  Skipping staging transformation - service unhealthy");
      return;
    }

    // Define Patient extract handler
    const patientHandler: StagingExtractHandler = {
      extractType: "Patient",
      sourceTable: "raw.patients",
      targetTable: "stg.patients",
      naturalKeys: ["patient_id", "practice_id", "per_org_id"],
      transformations: [
        // Core identifiers
        {
          sourceColumn: "patient_id",
          targetColumn: "patient_id",
          targetType: ColumnType.TEXT,
          required: true,
        },
        {
          sourceColumn: "practice_id",
          targetColumn: "practice_id",
          targetType: ColumnType.TEXT,
          required: true,
        },
        {
          sourceColumn: "per_org_id",
          targetColumn: "per_org_id",
          targetType: ColumnType.TEXT,
          required: true,
        },
        // Personal details
        {
          sourceColumn: "nhi_number",
          targetColumn: "nhi_number",
          targetType: ColumnType.TEXT,
          required: false,
          validationRules: [ValidationRuleBuilders.nhiFormat("nhi_number")],
        },
        {
          sourceColumn: "first_name",
          targetColumn: "first_name",
          targetType: ColumnType.TEXT,
          required: false,
        },
        {
          sourceColumn: "middle_name",
          targetColumn: "middle_name",
          targetType: ColumnType.TEXT,
          required: false,
        },
        {
          sourceColumn: "family_name",
          targetColumn: "family_name",
          targetType: ColumnType.TEXT,
          required: false,
        },
        {
          sourceColumn: "full_name",
          targetColumn: "full_name",
          targetType: ColumnType.TEXT,
          required: false,
        },
        // Dates
        {
          sourceColumn: "dob",
          targetColumn: "dob",
          targetType: ColumnType.DATE,
          required: false,
        },
        {
          sourceColumn: "death_date",
          targetColumn: "death_date",
          targetType: ColumnType.DATE,
          required: false,
        },
        // Booleans
        {
          sourceColumn: "is_alive",
          targetColumn: "is_alive",
          targetType: ColumnType.BOOLEAN,
          required: false,
        },
        {
          sourceColumn: "is_active",
          targetColumn: "is_active",
          targetType: ColumnType.BOOLEAN,
          required: false,
        },
        {
          sourceColumn: "is_deleted",
          targetColumn: "is_deleted",
          targetType: ColumnType.BOOLEAN,
          required: false,
        },
        // Numeric fields
        {
          sourceColumn: "age",
          targetColumn: "age",
          targetType: ColumnType.INTEGER,
          required: false,
          validationRules: [ValidationRuleBuilders.range("age", 0, 150)],
        },
        {
          sourceColumn: "balance",
          targetColumn: "balance",
          targetType: ColumnType.DECIMAL,
          required: false,
        },
        // Contact info
        {
          sourceColumn: "email",
          targetColumn: "email",
          targetType: ColumnType.TEXT,
          required: false,
          validationRules: [ValidationRuleBuilders.email("email")],
        },
        {
          sourceColumn: "cell_number",
          targetColumn: "cell_number",
          targetType: ColumnType.TEXT,
          required: false,
        },
      ],
    };

    console.log(`🔄 Transforming Patient data from load run: ${loadRunId}`);

    // Transform the data
    const result = await transformer.transformExtract(patientHandler, {
      loadRunId,
      upsertMode: true,
      conflictColumns: ["patient_id", "practice_id", "per_org_id"],
    });

    // Display results
    console.log("\n📊 Transformation Results:");
    console.log(`  Total rows read:        ${result.totalRowsRead}`);
    console.log(`  Successfully transformed: ${result.totalRowsTransformed}`);
    console.log(`  Rejected rows:          ${result.totalRowsRejected}`);
    console.log(`  Successful batches:     ${result.successfulBatches}`);
    console.log(`  Failed batches:         ${result.failedBatches}`);
    console.log(`  Duration:               ${result.durationMs}ms`);
    console.log(
      `  Throughput:             ${Math.round(result.rowsPerSecond)} rows/sec`
    );
    console.log(
      `  Memory usage:           ${result.memoryUsageMB.toFixed(2)} MB`
    );
    console.log(`  Errors:                 ${result.errors.length}`);
    console.log(`  Warnings:               ${result.warnings.length}`);

    // Show rejection summary if there are rejections
    if (result.totalRowsRejected > 0) {
      console.log("\n⚠️  Rejection Summary:");
      const rejectionRate =
        (result.totalRowsRejected / result.totalRowsRead) * 100;
      console.log(`  Rejection rate:         ${rejectionRate.toFixed(2)}%`);

      // Show top rejection reasons
      const reasonCounts = new Map<string, number>();
      for (const rejection of result.rejections) {
        reasonCounts.set(
          rejection.rejectionReason,
          (reasonCounts.get(rejection.rejectionReason) || 0) + 1
        );
      }

      console.log("\n  Top rejection reasons:");
      Array.from(reasonCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([reason, count]) => {
          console.log(`    - ${reason}: ${count} rows`);
        });
    }

    // Show sample errors if any
    if (result.errors.length > 0) {
      console.log("\n❌ Sample Errors (first 3):");
      result.errors.slice(0, 3).forEach((error, idx) => {
        console.log(`  ${idx + 1}. ${error.errorType}: ${error.message}`);
      });
    }

    // Success message
    if (result.totalRowsTransformed > 0) {
      console.log(
        "\n✅ Staging Transformer Service tests completed successfully!"
      );
      console.log(
        `   ${result.totalRowsTransformed} rows now in stg.patients table`
      );
    } else {
      console.log(
        "\n⚠️  No rows were transformed - check raw data availability"
      );
    }

    // Close connections
    await transformer.close();
  } catch (error) {
    console.error("❌ Staging Transformer Service test failed:", error);

    if (error instanceof Error) {
      console.error("🔍 Error details:", {
        message: error.message,
        stack: error.stack?.split("\n").slice(0, 5).join("\n"),
      });
    }

    // Don't exit in test mode, just log the error
    if (!config.testMode) {
      throw error;
    }
  }
}

async function testCoreMergerService(loadRunId: string): Promise<void> {
  console.log("\n🔀 Testing Core Merger Service (stg.* → core.* tables)...");

  try {
    const { CoreMergerContainer } = await import("./services/core-merger");

    // Create core merger service
    // Using partial config - defaults will be merged
    const coreMerger = CoreMergerContainer.create();

    // Health check
    const isHealthy = await coreMerger.healthCheck();
    console.log(
      `🏥 Core Merger health: ${isHealthy ? "✅ Healthy" : "❌ Unhealthy"}`
    );

    if (!isHealthy) {
      console.log("⚠️  Skipping core merge - service unhealthy");
      return;
    }

    console.log(`🔀 Merging staging data to core for load run: ${loadRunId}`);

    // Merge to core
    const result = await coreMerger.mergeToCore({
      loadRunId,
      forceReprocess: true, // Ensure we process all data for testing
      extractTypes: ["Patient"],
    });

    // Display results
    console.log("\n📊 Core Merge Results:");
    console.log(`  Merge run ID:           ${result.mergeRunId}`);
    console.log(`  Status:                 ${result.status}`);
    console.log(`  Dimensions created:     ${result.dimensionsCreated}`);
    console.log(`  Dimensions updated:     ${result.dimensionsUpdated}`);
    console.log(`  Facts inserted:         ${result.factsInserted}`);
    console.log(`  Facts updated:          ${result.factsUpdated}`);
    console.log(`  Total errors:           ${result.totalErrors}`);
    console.log(`  Total warnings:         ${result.totalWarnings}`);
    console.log(`  Duration:               ${result.durationMs}ms`);

    // Show dimension results
    if (result.dimensionResults.size > 0) {
      console.log("\n📐 Dimension Results:");
      for (const [dimType, dimResult] of result.dimensionResults.entries()) {
        console.log(`  ${dimType}:`);
        console.log(`    - Created:  ${dimResult.recordsCreated}`);
        console.log(
          `    - Updated:  ${dimResult.recordsUpdated} (new versions)`
        );
        console.log(`    - Skipped:  ${dimResult.recordsSkipped} (no change)`);
        console.log(`    - Errors:   ${dimResult.errors.length}`);
      }
    }

    // Show fact results
    if (result.factResults.size > 0) {
      console.log("\n📊 Fact Results:");
      for (const [factType, factResult] of result.factResults.entries()) {
        console.log(`  ${factType}:`);
        console.log(`    - Inserted: ${factResult.recordsInserted}`);
        console.log(`    - Updated:  ${factResult.recordsUpdated}`);
        console.log(`    - Skipped:  ${factResult.recordsSkipped}`);
        console.log(`    - Errors:   ${factResult.errors.length}`);

        // Show missing FK summary
        if (factResult.missingFKSummary.size > 0) {
          console.log("    - Missing FKs:");
          for (const [
            dimType,
            count,
          ] of factResult.missingFKSummary.entries()) {
            console.log(`      * ${dimType}: ${count}`);
          }
        }
      }
    }

    // Success message
    if (result.status === "completed") {
      console.log("\n✅ Core Merger Service tests completed successfully!");
      console.log(
        `   ${result.dimensionsCreated + result.dimensionsUpdated} dimensions and ${result.factsInserted} facts loaded to core`
      );
    } else {
      console.log("\n⚠️  Core merge completed with issues - check logs");
    }

    // Close connections
    await coreMerger.close();
  } catch (error) {
    console.error("❌ Core Merger Service test failed:", error);

    if (error instanceof Error) {
      console.error("🔍 Error details:", {
        message: error.message,
        stack: error.stack?.split("\n").slice(0, 5).join("\n"),
      });
    }

    // Don't exit in test mode, just log the error
    if (!config.testMode) {
      throw error;
    }
  }
}

// eslint-disable-next-line @typescript-eslint/require-await
async function main(): Promise<void> {
  const loadRunId = await testRawLoaderService();

  if (loadRunId) {
    await testStagingTransformerService(loadRunId);

    await testCoreMergerService(loadRunId);
  }

  console.log("✅ Application completed successfully!");
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
