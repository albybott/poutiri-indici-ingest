import "dotenv/config";

interface AppConfig {
  databaseUrl: string;
}

const config: AppConfig = {
  databaseUrl: process.env.DATABASE_URL!,
};

// eslint-disable-next-line @typescript-eslint/require-await
async function main(): Promise<void> {
  console.log("🚀 Starting application...");
  console.log(`📡 Database URL: ${config.databaseUrl}`);

  // Your application logic here
  console.log("✅ Application started successfully!");
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
