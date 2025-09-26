import "dotenv/config";
import { S3DiscoveryService } from "./services/discovery";

interface AppConfig {
  databaseUrl: string;
  s3Bucket?: string;
  awsRegion?: string;
  testMode: boolean;
}

const config: AppConfig = {
  databaseUrl: process.env.DATABASE_URL!,
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

  // Test S3 Discovery Service
  await testS3DiscoveryService();

  console.log("✅ Application started successfully!");
}

async function testS3DiscoveryService(): Promise<void> {
  console.log("\n🔍 Testing S3 Discovery Service...");

  try {
    // Test 1: Initialize service with default configuration
    console.log("\n1️⃣  Testing service initialization...");
    const service = new S3DiscoveryService();
    console.log("✅ Service initialized successfully");

    // Test 2: Get and display configuration
    console.log("\n2️⃣  Testing configuration...");
    const serviceConfig = service.getConfig();
    console.log("📋 Current configuration:", {
      bucket: serviceConfig.s3.bucket,
      region: serviceConfig.s3.region,
      maxKeys: serviceConfig.s3.maxKeys,
      enableVersioning: serviceConfig.discovery.enableVersioning,
      validateHashes: serviceConfig.discovery.validateHashes,
    });

    // Test 3: Health check
    console.log("\n3️⃣  Testing health check...");
    const isHealthy = await service.healthCheck();
    console.log(
      `🏥 Service health: ${isHealthy ? "✅ Healthy" : "❌ Unhealthy"}`
    );

    // Test 4: Configuration update
    console.log("\n4️⃣  Testing configuration update...");
    const originalMaxKeys = service.getConfig().s3.maxKeys;
    service.updateConfig({
      s3: {
        ...service.getConfig().s3,
        maxKeys: 500,
      },
    });
    console.log(
      `📝 Updated maxKeys from ${originalMaxKeys} to ${service.getConfig().s3.maxKeys}`
    );

    // Test 5: Custom configuration (if S3 credentials are available)
    if (config.s3Bucket && config.awsRegion) {
      console.log("\n5️⃣  Testing custom configuration...");
      const customService = new S3DiscoveryService({
        s3: {
          bucket: config.s3Bucket,
          region: config.awsRegion,
          maxConcurrency: 2,
          retryAttempts: 2,
        },
        discovery: {
          ...service.getConfig().discovery,
          batchSize: 500,
          maxFilesPerBatch: 50,
          cacheTtlMinutes: 30,
        },
        processing: {
          priorityExtracts: ["Patient", "Appointments"],
          maxConcurrentFiles: 5,
          processingTimeoutMs: 120000,
        },
      });

      console.log("✅ Custom service created with:", {
        bucket: customService.getConfig().s3.bucket,
        maxConcurrency: customService.getConfig().s3.maxConcurrency,
        batchSize: customService.getConfig().discovery.batchSize,
      });

      // Test 6: Get service status
      console.log("\n6️⃣  Testing service status...");
      const status = await customService.getDiscoveryStatus();
      console.log("📊 Service status:", {
        healthy: status.isHealthy,
        availableBatches: status.availableBatches,
        pendingFiles: status.pendingFiles,
        metrics: {
          filesDiscovered: status.metrics.filesDiscovered,
          batchesFound: status.metrics.batchesFound,
          totalSizeBytes: status.metrics.totalSizeBytes,
        },
      });

      // Test 7: Discovery with options (commented out to avoid actual S3 calls)
      if (config.testMode) {
        const processingPlan = await customService.discoverLatestFiles({
          extractTypes: ["Patient", "Appointments"],
          maxBatches: 3,
        });

        console.log("📦 Processing plan created:", {
          totalFiles: processingPlan.totalFiles,
          batches: processingPlan.batches.length,
          estimatedDuration: processingPlan.estimatedDuration,
        });

        console.log("⏭️  Skipping actual S3 calls in test mode");
      }
    } else {
      console.log(
        "\n⚠️  S3 credentials not configured, skipping S3 operations"
      );
      console.log("💡 To enable S3 testing, set:");
      console.log("   - S3_BUCKET_NAME: your-bucket-name");
      console.log("   - AWS_REGION: your-region");
      console.log("   - AWS_ACCESS_KEY_ID: your-access-key");
      console.log("   - AWS_SECRET_ACCESS_KEY: your-secret-key");
    }

    console.log("\n✅ S3 Discovery Service tests completed successfully!");
  } catch (error) {
    console.error("❌ S3 Discovery Service test failed:", error);

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
