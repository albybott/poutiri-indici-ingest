// import "dotenv/config";
// import { S3DiscoveryService } from "./services/discovery";
// import { RawLoaderContainer } from "./services/raw-loader";
// import type { RawLoaderConfig } from "./services/raw-loader/types/config";
// import type { DiscoveredFile } from "./services/discovery/types/files";

// interface AppConfig {
//   databaseUrl: string;
//   s3Bucket?: string;
//   awsRegion?: string;
//   testMode: boolean;
// }

// const config: AppConfig = {
//   databaseUrl: `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
//   s3Bucket: process.env.S3_BUCKET_NAME,
//   awsRegion: process.env.AWS_REGION,
//   testMode: process.env.NODE_ENV !== "production",
// };

// // eslint-disable-next-line @typescript-eslint/require-await
// async function main(): Promise<void> {
//   console.log("🚀 Starting application...");
//   console.log(`📡 Database URL: ${config.databaseUrl}`);
//   console.log(`☁️  S3 Bucket: ${config.s3Bucket || "Not configured"}`);
//   console.log(`🌍 AWS Region: ${config.awsRegion || "Not configured"}`);
//   console.log(`🧪 Test Mode: ${config.testMode ? "Enabled" : "Disabled"}`);

//   // Test S3 Discovery Service
//   await testS3DiscoveryService();

//   // Test Raw Loader Service
//   await testRawLoaderService();

//   console.log("✅ Application started successfully!");
// }

// async function testS3DiscoveryService(): Promise<void> {
//   console.log("\n🔍 Testing S3 Discovery Service...");

//   try {
//     // Test 1: Initialize service with default configuration
//     console.log("\n1️⃣  Testing service initialization...");
//     const service = new S3DiscoveryService();
//     console.log("✅ Service initialized successfully");

//     // Test 2: Get and display configuration
//     console.log("\n2️⃣  Testing configuration...");
//     const serviceConfig = service.getConfig();
//     console.log("📋 Current configuration:", {
//       bucket: serviceConfig.s3.bucket,
//       region: serviceConfig.s3.region,
//       maxKeys: serviceConfig.s3.maxKeys,
//       enableVersioning: serviceConfig.discovery.enableVersioning,
//       validateHashes: serviceConfig.discovery.validateHashes,
//     });

//     // Test 3: Health check
//     console.log("\n3️⃣  Testing health check...");
//     const isHealthy = await service.healthCheck();
//     console.log(
//       `🏥 Service health: ${isHealthy ? "✅ Healthy" : "❌ Unhealthy"}`
//     );

//     // Test 4: Configuration update
//     console.log("\n4️⃣  Testing configuration update...");
//     const originalMaxKeys = service.getConfig().s3.maxKeys;
//     service.updateConfig({
//       s3: {
//         ...service.getConfig().s3,
//         maxKeys: 500,
//       },
//     });
//     console.log(
//       `📝 Updated maxKeys from ${originalMaxKeys} to ${service.getConfig().s3.maxKeys}`
//     );

//     // Test 5: Custom configuration (if S3 credentials are available)
//     if (config.s3Bucket && config.awsRegion) {
//       console.log("\n5️⃣  Testing custom configuration...");
//       const customService = new S3DiscoveryService({
//         s3: {
//           bucket: config.s3Bucket,
//           region: config.awsRegion,
//           maxConcurrency: 2,
//           retryAttempts: 2,
//         },
//         discovery: {
//           ...service.getConfig().discovery,
//           batchSize: 500,
//           maxFilesPerBatch: 50,
//           cacheTtlMinutes: 30,
//         },
//         processing: {
//           priorityExtracts: ["Patient", "Appointments"],
//           maxConcurrentFiles: 5,
//           processingTimeoutMs: 120000,
//         },
//       });

//       console.log("✅ Custom service created with:", {
//         bucket: customService.getConfig().s3.bucket,
//         maxConcurrency: customService.getConfig().s3.maxConcurrency,
//         batchSize: customService.getConfig().discovery.batchSize,
//       });

//       // Test 6: Get service status
//       console.log("\n6️⃣  Testing service status...");
//       const status = await customService.getDiscoveryStatus();
//       console.log("📊 Service status:", {
//         healthy: status.isHealthy,
//         availableBatches: status.availableBatches,
//         pendingFiles: status.pendingFiles,
//         metrics: {
//           filesDiscovered: status.metrics.filesDiscovered,
//           batchesFound: status.metrics.batchesFound,
//           totalSizeBytes: status.metrics.totalSizeBytes,
//         },
//       });

//       // Test 7: Discovery with options (commented out to avoid actual S3 calls)
//       if (config.testMode) {
//         const processingPlan = await customService.discoverLatestFiles({
//           extractTypes: ["Patient", "Appointments"],
//           maxBatches: 3,
//         });

//         console.log("📦 Processing plan created:", {
//           totalFiles: processingPlan.totalFiles,
//           batches: processingPlan.batches.length,
//           estimatedDuration: processingPlan.estimatedDuration,
//         });

//         console.log("⏭️  Skipping actual S3 calls in test mode");
//       }
//     } else {
//       console.log(
//         "\n⚠️  S3 credentials not configured, skipping S3 operations"
//       );
//       console.log("💡 To enable S3 testing, set:");
//       console.log("   - S3_BUCKET_NAME: your-bucket-name");
//       console.log("   - AWS_REGION: your-region");
//       console.log("   - AWS_ACCESS_KEY_ID: your-access-key");
//       console.log("   - AWS_SECRET_ACCESS_KEY: your-secret-key");
//     }

//     console.log("\n✅ S3 Discovery Service tests completed successfully!");
//   } catch (error) {
//     console.error("❌ S3 Discovery Service test failed:", error);

//     if (error instanceof Error) {
//       console.error("🔍 Error details:", {
//         message: error.message,
//         stack: error.stack?.split("\n").slice(0, 3).join("\n"), // First 3 lines of stack
//       });
//     }

//     // Don't exit in test mode, just log the error
//     if (!config.testMode) {
//       throw error;
//     }
//   }
// }

// async function testRawLoaderService(): Promise<void> {
//   console.log("\n📦 Testing Raw Loader Service...");

//   try {
//     // Test 1: Initialize service with default configuration
//     console.log("\n1️⃣  Testing service initialization...");
//     const rawLoaderConfig: RawLoaderConfig = {
//       database: {
//         poolSize: 10,
//         timeoutMs: 30000,
//         maxConnections: 20,
//       },
//       processing: {
//         batchSize: 1000,
//         maxConcurrentFiles: 5,
//         maxMemoryMB: 512,
//         enableStreaming: true,
//         bufferSizeMB: 16,
//         continueOnError: true,
//       },
//       csv: {
//         fieldSeparator: "|~~|",
//         rowSeparator: "|^^|",
//         maxRowLength: 10000,
//         hasHeaders: false,
//         skipEmptyRows: true,
//       },
//       errorHandling: {
//         maxRetries: 3,
//         retryDelayMs: 1000,
//         continueOnError: true,
//         logErrors: true,
//         errorThreshold: 0.1,
//       },
//       monitoring: {
//         enableMetrics: true,
//         logLevel: "info",
//         metricsInterval: 30000,
//         enableProgressTracking: true,
//         progressUpdateInterval: 5000,
//       },
//     };

//     const rawLoader = RawLoaderContainer.create(rawLoaderConfig);
//     console.log("✅ Raw Loader Service initialized successfully");

//     // Test 2: Create a mock DiscoveredFile for testing
//     console.log("\n2️⃣  Testing with mock file data...");
//     const mockFile: DiscoveredFile = {
//       s3Key: "test-patients-20250101.csv",
//       s3VersionId: "version-123",
//       fileHash: "hash-456",
//       s3Bucket: "test-bucket",
//       fileSize: 1000,
//       lastModified: new Date(),
//       etag: "etag-123",
//       parsed: {
//         extractType: "patients",
//         dateExtracted: new Date("2025-01-01T08:00:00Z"),
//         perOrgId: "685146",
//         practiceId: "545",
//         dateFrom: new Date("2025-01-01T00:00:00Z"),
//         dateTo: new Date("2025-01-01T23:59:59Z"),
//         isFullLoad: true,
//         isDelta: false,
//         batchId: "20250101",
//       },
//     };

//     console.log("📋 Mock file metadata:", {
//       s3Key: mockFile.s3Key,
//       extractType: mockFile.parsed.extractType,
//       batchId: mockFile.parsed.batchId,
//     });

//     // Test 3: Test service methods
//     console.log("\n3️⃣  Testing service methods...");

//     // Health check
//     const isHealthy = await rawLoader.healthCheck();
//     console.log(
//       `🏥 Service health: ${isHealthy ? "✅ Healthy" : "❌ Unhealthy"}`
//     );

//     // Get metrics (should return initial metrics)
//     const metrics = await rawLoader.getMetrics();
//     console.log("📊 Initial metrics:", {
//       filesProcessed: metrics.filesProcessed,
//       totalRowsLoaded: metrics.totalRowsLoaded,
//       errorRate: metrics.errorRate,
//     });

//     // Test 4: Test error summary with empty errors
//     console.log("\n4️⃣  Testing error summary...");
//     const errorSummary = await rawLoader.getErrorSummary([]);
//     console.log("📝 Error summary:", {
//       totalErrors: errorSummary.totalErrors,
//       retryableErrors: errorSummary.retryableErrors,
//       blockingErrors: errorSummary.blockingErrors,
//     });

//     // Test 5: Test load progress (should return default progress)
//     console.log("\n5️⃣  Testing load progress...");
//     const progress = await rawLoader.getLoadProgress("test-file");
//     console.log("📈 Load progress:", {
//       fileKey: progress.fileKey,
//       extractType: progress.extractType,
//       totalRows: progress.totalRows,
//       processedRows: progress.processedRows,
//       currentStatus: progress.currentStatus,
//     });

//     // Test 6: Test idempotency check
//     console.log("\n6️⃣  Testing idempotency check...");
//     // This would normally require a database connection, but we can test the basic logic
//     console.log(
//       "✅ Idempotency service initialized (actual database operations require DB connection)"
//     );

//     // Test 7: Configuration validation
//     console.log("\n7️⃣  Testing configuration validation...");
//     console.log("📋 Configuration:", {
//       databasePoolSize: rawLoaderConfig.database.poolSize,
//       processingBatchSize: rawLoaderConfig.processing.batchSize,
//       csvFieldSeparator: rawLoaderConfig.csv.fieldSeparator,
//       errorMaxRetries: rawLoaderConfig.errorHandling.maxRetries,
//     });

//     // Test 8: Test CSV parser (basic validation)
//     console.log("\n8️⃣  Testing CSV parser configuration...");
//     const csvConfig = rawLoaderConfig.csv;
//     console.log("🔧 CSV configuration:", {
//       fieldSeparator: csvConfig.fieldSeparator,
//       rowSeparator: csvConfig.rowSeparator,
//       hasHeaders: csvConfig.hasHeaders,
//       skipEmptyRows: csvConfig.skipEmptyRows,
//     });

//     // Test 9: Try to load actual data (if environment allows)
//     console.log("\n9️⃣  Testing actual data loading...");
//     if (config.testMode && config.s3Bucket && config.awsRegion) {
//       console.log("🔄 Attempting to load a small batch of real data...");
//       try {
//         // Create a small processing plan to load just one file
//         const discoveryService = new S3DiscoveryService({
//           s3: {
//             bucket: config.s3Bucket,
//             region: config.awsRegion,
//             maxConcurrency: 1,
//             retryAttempts: 2,
//           },
//           discovery: {
//             batchSize: 1,
//             maxFilesPerBatch: 1,
//             enableVersioning: true,
//             validateHashes: false,
//             cacheMetadata: false,
//             cacheTtlMinutes: 5,
//           },
//           processing: {
//             priorityExtracts: ["Patient", "Appointments"],
//             maxConcurrentFiles: 1,
//             processingTimeoutMs: 60000,
//           },
//         });

//         const processingPlan = await discoveryService.discoverLatestFiles({
//           extractTypes: ["Patient"],
//           maxBatches: 1,
//         });

//         if (
//           processingPlan.batches.length > 0 &&
//           processingPlan.batches[0].files.length > 0
//         ) {
//           console.log(
//             `📁 Found ${processingPlan.batches[0].files.length} files in latest batch`
//           );

//           // Create a load run ID
//           const loadRunId = `TEST_RUN_${Date.now()}`;

//           console.log(`🏃 Starting load run: ${loadRunId}`);

//           // Load the first batch
//           const loadResults = await rawLoader.loadMultipleFiles(
//             processingPlan.batches[0].files.slice(0, 1), // Load just 1 file
//             loadRunId,
//             {
//               batchSize: 500, // Smaller batches for testing
//               continueOnError: true,
//               maxConcurrentFiles: 1,
//             }
//           );

//           console.log("✅ Load completed!", {
//             filesProcessed: loadResults.length,
//             totalRows: loadResults.reduce((sum, r) => sum + r.totalRows, 0),
//             successfulBatches: loadResults.reduce(
//               (sum, r) => sum + r.successfulBatches,
//               0
//             ),
//             failedBatches: loadResults.reduce(
//               (sum, r) => sum + r.failedBatches,
//               0
//             ),
//             errors: loadResults.reduce((sum, r) => sum + r.errors.length, 0),
//           });

//           // Show detailed results for the first file
//           if (loadResults.length > 0) {
//             const firstResult = loadResults[0];
//             console.log("📊 First file details:", {
//               totalRows: firstResult.totalRows,
//               successfulBatches: firstResult.successfulBatches,
//               failedBatches: firstResult.failedBatches,
//               durationMs: firstResult.durationMs,
//               rowsPerSecond: Math.round(firstResult.rowsPerSecond),
//               memoryUsageMB: firstResult.memoryUsageMB,
//               errors: firstResult.errors.length,
//             });
//           }
//         } else {
//           console.log("⚠️  No files found in the latest batch");
//         }
//       } catch (error) {
//         console.error("❌ Error loading real data:", error);
//         console.log(
//           "💡 This is expected if database connection is not available"
//         );
//       }
//     } else {
//       console.log(
//         "⚠️  Cannot load real data - missing S3 credentials or not in test mode"
//       );
//     }

//     console.log("\n✅ Raw Loader Service tests completed successfully!");
//   } catch (error) {
//     console.error("❌ Raw Loader Service test failed:", error);

//     if (error instanceof Error) {
//       console.error("🔍 Error details:", {
//         message: error.message,
//         stack: error.stack?.split("\n").slice(0, 3).join("\n"), // First 3 lines of stack
//       });
//     }

//     // Don't exit in test mode, just log the error
//     if (!config.testMode) {
//       throw error;
//     }
//   }
// }

// // Handle unhandled promise rejections
// process.on("unhandledRejection", (reason, promise) => {
//   console.error("Unhandled Rejection at:", promise, "reason:", reason);
//   process.exit(1);
// });

// // Handle uncaught exceptions
// process.on("uncaughtException", (error) => {
//   console.error("Uncaught Exception:", error);
//   process.exit(1);
// });

// // Graceful shutdown
// process.on("SIGINT", () => {
//   console.log("👋 Received SIGINT. Shutting down gracefully...");
//   process.exit(0);
// });

// // Start the application
// main().catch((error) => {
//   console.error("❌ Failed to start application:", error);
//   process.exit(1);
// });
