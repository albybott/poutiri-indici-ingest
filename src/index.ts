import "dotenv/config";

interface AppConfig {
  port: number;
  environment: string;
}

const config: AppConfig = {
  port: parseInt(process.env.PORT || "3000", 10),
  environment: process.env.NODE_ENV || "development",
};

async function main(): Promise<void> {
  console.log("🚀 Starting application...");
  console.log(`📡 Environment: ${config.environment}`);
  console.log(`🌐 Port: ${config.port}`);

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
