import "dotenv/config";
import {
  S3DiscoveryService,
  type ProcessingPlan,
} from "./services/discovery/index";
import {
  RawLoaderFactory,
  type LoadResult,
  type ProcessingPlanResult,
} from "./services/raw-loader/index";
import type { RawLoaderConfig } from "./services/raw-loader/types/config";
import type { DiscoveredFile } from "./services/discovery/types/files";
import {
  StagingTransformerContainer,
  ColumnType,
  ValidationRuleBuilders,
  type StagingExtractHandler,
  StagingHandlerFactory,
} from "@/services/staging-transformer/index";
import { LoadRunService } from "@/services/raw-loader/load-run-service";
import type { ExtractType } from "@/db/schema";

interface AppConfig {
  databaseUrl: string;
  s3Bucket?: string;
  awsRegion?: string;
  failOnError: boolean;
}

const config: AppConfig = {
  databaseUrl: `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`, // PostgreSQL connection string for the ETL database
  s3Bucket: process.env.S3_BUCKET_NAME, // S3 bucket name containing Indici healthcare data extracts
  awsRegion: process.env.AWS_REGION, // AWS region where the S3 bucket is located
  failOnError: process.env.NODE_ENV !== "production", // Whether to exit on errors (true for development, false for production)
};

function init(): void {
  console.log("🚀 Starting application...");
  console.log(`📡 Database URL: ${config.databaseUrl}`);
  console.log(`☁️  S3 Bucket: ${config.s3Bucket || "Not configured"}`);
  console.log(`🌍 AWS Region: ${config.awsRegion || "Not configured"}`);
  console.log(`🧪 Test Mode: ${config.failOnError ? "Enabled" : "Disabled"}`);
}

const testExtractTypes: ExtractType[] = [
  "Patient",
  // "Appointments",
  // "Provider",
  // "PracticeInfo",
  // "Invoices",
  // "InvoiceDetail",
  // "Immunisation",
  // "Diagnosis",
  // "Measurements",
  // "Recalls",
  // "Inbox",
  // "InboxDetail",
  // "Medicine",
  // "NextOfKin",
  // "Vaccine",
  // "Allergies",
  // "AppointmentMedications",
  // "PatientAlerts",
];

async function testDiscoveryService(): Promise<ProcessingPlan | null> {
  try {
    if (!config.s3Bucket || !config.awsRegion) {
      console.log("⚠️  Cannot test discovery service - missing S3 credentials");
      return null;
    }

    const discoveryService = new S3DiscoveryService({
      s3: {
        bucket: config.s3Bucket, // S3 bucket to scan for data files
        region: config.awsRegion, // AWS region for S3 operations
        maxConcurrency: 1, // Maximum concurrent S3 requests for file operations
        retryAttempts: 2, // Number of retry attempts for failed S3 operations
      },
      discovery: {
        batchSize: 1, // Number of files to process in each discovery batch
        maxFilesPerBatch: 1, // Maximum files to include per processing batch
        enableVersioning: true, // Whether to check for S3 object versions
        validateHashes: false, // Whether to validate file integrity using hashes
        cacheMetadata: false, // Whether to cache S3 metadata to reduce API calls
        cacheTtlMinutes: 5, // Time-to-live for cached metadata in minutes
      },
      processing: {
        priorityExtracts: testExtractTypes, // List of extract types to prioritize during processing
        maxConcurrentFiles: 1, // Maximum files to process concurrently
        processingTimeoutMs: 60000, // Timeout for individual file processing operations
      },
    });

    const isDiscoveryHealthy = await discoveryService.healthCheck();
    console.log(
      `🏥 Discovery service health: ${isDiscoveryHealthy ? "✅ Healthy" : "❌ Unhealthy"}`
    );

    /**
     * Create a processing plan for this run
     * A processing plan is a structured plan that organizes discovered files into batches for processing.
     * It contains:
     * - batches: Array of FileBatch objects, each containing files from the same extraction date
     * - totalFiles: Total count of files across all batches
     * - estimatedDuration: Estimated processing time in seconds
     * - dependencies: Extract type dependencies (e.g., Patients before Appointments)
     * - processingOrder: Optimized order for processing files
     * - warnings: Non-critical issues found during discovery
     */
    const processingPlan = await discoveryService.discoverLatestFiles({
      extractTypes: testExtractTypes,
      // Remove maxBatches limit to process all available batches
    });

    console.log(
      `📁 Found ${processingPlan.batches.length} batches with ${processingPlan.totalFiles} total files for extraction:\n${processingPlan.batches
        .flatMap((b) => b.files)
        .map((f) => f.s3Key)
        .join("\n")}
      `
    );
    return processingPlan;
  } catch (error) {
    console.error("❌ Discovery Service test failed:", error);

    if (error instanceof Error) {
      console.error("🔍 Error details:", {
        message: error.message,
        stack: error.stack?.split("\n").slice(0, 3).join("\n"), // First 3 lines of stack
      });
    }

    // Don't exit in test mode, just log the error
    if (config.failOnError) {
      throw error;
    }
    return null;
  }
}

async function testRawLoaderService(
  processingPlan: ProcessingPlan
): Promise<string | null> {
  const loadRunService = new LoadRunService();
  let loadRunId: string | null = null;

  try {
    if (!processingPlan || processingPlan.batches.length === 0) {
      console.log("🚨  No batches found in the processing plan");
      return null;
    }

    // Create a single load run for this entire execution
    loadRunId = await loadRunService.createLoadRun({
      triggeredBy: "manual",
      notes: `Processing ${processingPlan.totalFiles} files across ${processingPlan.batches.length} batches for extraction types: ${processingPlan.dependencies.map((d) => d.extractType).join(", ")}`,
    });

    if (!loadRunId) {
      console.log("⚠️  Failed to create load run");
      return null;
    }

    console.log(`🎽 Created load run: ${loadRunId}`);

    // Raw loader configuration
    const rawLoaderConfig: RawLoaderConfig = {
      // Database configuration
      database: {
        poolSize: 10, // Number of database connections to maintain in the pool
        timeoutMs: 30000, // Timeout for database operations in milliseconds
        maxConnections: 20, // Maximum number of database connections allowed
      },
      // Processing configuration
      processing: {
        batchSize: 1000, // Batch size raw records to be loaded into the database
        maxConcurrentFiles: 5, // Maximum number of files to process concurrently
        maxMemoryMB: 512, // Maximum memory usage for the raw loader
        enableStreaming: true, // Whether to enable streaming for the raw loader
        bufferSizeMB: 16, // Buffer size for the raw loader
        continueOnError: true, // Whether to continue processing other batches when one fails
      },
      // Error handling configuration
      errorHandling: {
        maxRetries: 3, // Maximum number of retries for failed batches
        retryDelayMs: 1000, // Delay between retries for failed batches
        continueOnError: true, // Whether to continue processing other batches when one fails
        logErrors: true, // Whether to log errors
        errorThreshold: 0.1, // Error percentage threshold for the raw loader, if the error rate exceeds this threshold, the raw loader will stop processing
      },
      // Monitoring configuration
      // TODO: Use this monitoring service in all of the stages
      monitoring: {
        enableMetrics: true, // Whether to collect and report performance metrics
        logLevel: "info", // Logging level for the raw loader (debug, info, warn, error)
        metricsInterval: 30000, // Interval for collecting metrics in milliseconds
        enableProgressTracking: true, // Whether to enable progress tracking for the raw loader
        progressUpdateInterval: 5000, // Interval for progress tracking updates in milliseconds
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

    const isRawLoaderHealthy = await rawLoader.healthCheck();
    console.log(
      `🏥 Raw Loader service health: ${isRawLoaderHealthy ? "✅ Healthy" : "❌ Unhealthy"}`
    );

    // Process all batches using the new loadBatches method
    const processingResult = await rawLoader.loadBatches(
      processingPlan.batches,
      loadRunId,
      {
        batchSize: 500, // Number of files to process in each batch during loading
        continueOnError: true, // Whether to continue processing remaining batches if one fails
        maxConcurrentFiles: 1, // Maximum number of files to process concurrently during loading
      }
    );

    // Extract metrics for backwards compatibility with existing code
    const totalBatchesProcessed = processingResult.batchesProcessed;
    const totalFilesProcessed = processingResult.totalFiles;
    const totalRowsIngested = processingResult.totalRows;
    const totalRowsRejected = 0; // Note: We don't have rejected rows count from LoadResult, tracking at 0 for now
    const allLoadResults = processingResult.batchResults.flatMap(
      (br) => br.fileResults
    );

    // Update load run with final statistics
    await loadRunService.completeLoadRun(loadRunId, {
      totalFilesProcessed,
      totalRowsIngested,
      totalRowsRejected,
    });

    // Overall summary
    console.log("🎉 All batches processing completed!", {
      loadRunId,
      batchesProcessed: processingResult.batchesProcessed,
      batchesFailed: processingResult.batchesFailed,
      totalFilesProcessed: processingResult.totalFiles,
      successfulFiles: processingResult.successfulFiles,
      failedFiles: processingResult.failedFiles,
      totalRows: processingResult.totalRows,
      totalErrors: processingResult.errors.length,
      totalWarnings: processingResult.warnings.length,
      overallDurationMs: processingResult.overallDuration,
    });

    // Show detailed results for the first batch if available
    if (processingResult.batchResults.length > 0) {
      const firstBatch = processingResult.batchResults[0];
      console.log("📊 Sample batch details:", {
        batchId: firstBatch.batchId,
        totalFiles: firstBatch.totalFiles,
        successfulFiles: firstBatch.successfulFiles,
        failedFiles: firstBatch.failedFiles,
        totalRows: firstBatch.totalRows,
        durationMs: firstBatch.durationMs,
        errors: firstBatch.errors.length,
        warnings: firstBatch.warnings.length,
      });
    }

    console.log("\n✅ Raw Loader Service tests completed successfully!");
    console.log(`📋 Load run ${loadRunId} completed`);
    return loadRunId;
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
    if (config.failOnError) {
      throw error;
    }
    return null;
  }
}

async function testStagingTransformerService(
  loadRunId: string
): Promise<{ stagingRunIds: string[] }> {
  console.log(
    "\n🔄 Testing Staging Transformer Service (raw.* → stg.* tables)..."
  );

  try {
    // Create staging transformer
    const transformer = StagingTransformerContainer.create({
      transformation: {
        batchSize: 1000, // Number of records to process in each transformation batch
        maxConcurrentTransforms: 3, // Maximum number of concurrent transformation operations
        enableTypeCoercion: true, // Whether to automatically convert data types during transformation
        dateFormat: "YYYY-MM-DD", // Expected format for date fields in the data
        timestampFormat: "YYYY-MM-DD HH:mm:ss", // Expected format for timestamp fields in the data
        decimalPrecision: 2, // Number of decimal places to maintain for numeric values
        trimStrings: true, // Whether to remove leading/trailing whitespace from string values
        nullifyEmptyStrings: true, // Whether to convert empty strings to null values
      },
      validation: {
        enableValidation: true, // Whether to validate data during transformation
        failOnValidationError: false, // Whether to stop processing when validation errors occur
        maxErrorsPerBatch: 100, // Maximum validation errors allowed per batch before stopping
        maxTotalErrors: 1000, // Maximum total validation errors allowed for the entire process
        rejectInvalidRows: true, // Whether to reject and track rows that fail validation
        trackRejectionReasons: true, // Whether to capture and report reasons for row rejections
      },
      errorHandling: {
        continueOnError: true, // Whether to continue processing other batches when one fails
        maxRetries: 3, // Maximum number of retry attempts for failed transformations
        retryDelayMs: 1000, // Delay between retry attempts in milliseconds
        captureRawRow: true, // Whether to capture the original raw data when errors occur
        enableDetailedLogging: true, // Whether to enable verbose error logging
      },
    });

    // Health check
    const isHealthy = await transformer.healthCheck();
    console.log(
      `🏥 Staging Transformer health: ${isHealthy ? "✅ Healthy" : "❌ Unhealthy"}`
    );

    if (!isHealthy) {
      console.log("⚠️  Skipping staging transformation - service unhealthy");
      throw new Error("Staging transformer service is unhealthy");
    }

    // Get the handler factory
    const handlerFactory = new StagingHandlerFactory();
    const stagingRunIds: string[] = [];
    let totalRowsTransformed = 0;
    let totalRowsRejected = 0;

    // Process each extract type
    for (const extractType of testExtractTypes) {
      try {
        const handler = await handlerFactory.getHandler(extractType);

        console.log(
          `🔄 Transforming ${extractType} data from load run: ${loadRunId}`
        );

        // Transform the data
        const result = await transformer.transformExtract(handler, {
          loadRunId, // ID of the load run this transformation belongs to
          upsertMode: true, // Whether to use upsert (insert/update) mode for staging tables
          // conflictColumns will be automatically converted from handler.naturalKeys
          forceReprocess: true, // Whether to force reprocessing even if data hasn't changed
          batchSize: 100, // Reduce batch size to test if query length is the issue
        });

        stagingRunIds.push(result.stagingRunId);
        totalRowsTransformed += result.totalRowsTransformed;
        totalRowsRejected += result.totalRowsRejected;

        // Display results for this extract type
        console.log(`\n📊 ${extractType} Transformation Results:`);
        console.log(`  Total rows read:        ${result.totalRowsRead}`);
        console.log(
          `  Successfully transformed: ${result.totalRowsTransformed}`
        );
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

        // Success message for this extract type
        if (result.totalRowsTransformed > 0) {
          console.log(
            `\n✅ ${extractType} transformation completed successfully!`
          );
          console.log(
            `   ${result.totalRowsTransformed} rows now in ${handler.targetTable} table`
          );
        } else {
          console.log(
            `\n⚠️  No rows were transformed for ${extractType} - check raw data availability`
          );
        }

        console.log(`\n${"=".repeat(80)}\n`); // Separator between extract types
      } catch (error) {
        console.error(`❌ Failed to transform ${extractType}:`, error);

        if (error instanceof Error) {
          console.error("🔍 Error details:", {
            message: error.message,
            stack: error.stack?.split("\n").slice(0, 3).join("\n"),
          });
        }

        // Continue with other extract types even if one fails
        console.log(`\n⏭️  Continuing with next extract type...\n`);
      }
    }

    // Overall summary
    console.log("\n📊 Overall Staging Transformation Summary:");
    console.log(`  Total extract types processed: ${testExtractTypes.length}`);
    console.log(`  Total rows transformed: ${totalRowsTransformed}`);
    console.log(`  Total rows rejected: ${totalRowsRejected}`);
    console.log(`  Staging run IDs: ${stagingRunIds.join(", ")}`);

    if (totalRowsTransformed > 0) {
      console.log(
        "\n✅ Staging Transformer Service tests completed successfully!"
      );
      console.log(`   All ${testExtractTypes.length} extract types processed`);
    } else {
      console.log(
        "\n⚠️  No rows were transformed - check raw data availability for all extract types"
      );
    }

    // Close connections
    await transformer.close();

    return { stagingRunIds };
  } catch (error) {
    console.error("❌ Staging Transformer Service test failed:", error);

    if (error instanceof Error) {
      console.error("🔍 Error details:", {
        message: error.message,
        stack: error.stack?.split("\n").slice(0, 5).join("\n"),
      });
    }

    // In test mode, re-throw the error to fail the pipeline
    if (config.failOnError) {
      throw error;
    }
    return { stagingRunIds: [] };
  }
}

async function testCoreMergerService(stagingRunId: string): Promise<void> {
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

    console.log(
      `🔀 Merging staging data to core for staging run: ${stagingRunId}`
    );

    // Merge to core
    const result = await coreMerger.mergeToCore({
      stagingRunId,
      forceReprocess: true, // Ensure we process all data for testing
      extractTypes: testExtractTypes,
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
    if (config.failOnError) {
      throw error;
    }
  }
}

// eslint-disable-next-line @typescript-eslint/require-await
async function main(): Promise<void> {
  try {
    init();

    const processingPlan = await testDiscoveryService();

    // const loadRunId = await testRawLoaderService(processingPlan);
    // if (!loadRunId) {
    //   throw new Error("There was an error with the raw loader service");
    // }

    // const { stagingRunIds } = await testStagingTransformerService(loadRunId);
    // if (!stagingRunIds || stagingRunIds.length === 0) {
    //   throw new Error(
    //     "There was an error with the staging transformer service"
    //   );
    // }

    // console.log(
    //   `✅ Staging transformation completed for ${stagingRunIds.length} extract types`
    // );

    // Note: Core merger service is commented out as requested
    // await testCoreMergerService(stagingRunIds);

    console.log("✅ Application completed successfully!");
  } catch (error) {
    console.error("❌ Failed to start application:", error);
    process.exit(1);
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
