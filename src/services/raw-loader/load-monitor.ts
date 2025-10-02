import type { LoadMetrics, LoadProgress, LoadStatus } from "./types/raw-loader";
import type { LoadError, LoadWarning } from "../../shared/types";
import type { MonitoringConfig } from "./types/config";

/**
 * Load Monitor - tracks and reports loading metrics and progress
 */
export class LoadMonitor {
  private config: MonitoringConfig;
  private metrics: LoadMetrics = this.initializeMetrics();
  private progressMap: Map<string, LoadProgress> = new Map();
  private metricsInterval?: NodeJS.Timeout;

  constructor(config: MonitoringConfig) {
    this.config = config;
    this.startMetricsCollection();
  }

  /**
   * Get current metrics
   */
  async getMetrics(): Promise<LoadMetrics> {
    return { ...this.metrics };
  }

  /**
   * Get progress for a specific file
   */
  async getProgress(fileKey: string): Promise<LoadProgress | null> {
    return this.progressMap.get(fileKey) || null;
  }

  /**
   * Get progress for all active loads
   */
  async getAllProgress(): Promise<LoadProgress[]> {
    return Array.from(this.progressMap.values());
  }

  /**
   * Update progress for a file
   */
  async updateProgress(progress: LoadProgress): Promise<void> {
    this.progressMap.set(progress.fileKey, progress);

    // Log progress if configured
    if (this.config.logLevel === "debug") {
      console.debug(
        `Progress update for ${progress.fileKey}: ${progress.processedRows}/${progress.totalRows}`
      );
    }
  }

  /**
   * Log metrics to console/monitoring system
   */
  async logMetrics(metrics: LoadMetrics): Promise<void> {
    const logLevel = this.config.logLevel;
    const consoleMethod = (console as any)[logLevel] ?? console.info;

    consoleMethod("Raw Loader Metrics:", {
      filesProcessed: metrics.filesProcessed,
      totalRowsLoaded: metrics.totalRowsLoaded,
      totalBytesProcessed: metrics.totalBytesProcessed,
      averageRowsPerSecond: metrics.averageRowsPerSecond,
      errorRate: metrics.errorRate,
      memoryPeakUsageMB: metrics.memoryPeakUsageMB,
      throughputMBps: metrics.throughputMBps,
    });
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    // Check if metrics collection is running
    return !!this.metricsInterval;
  }

  /**
   * Reset metrics
   */
  async resetMetrics(): Promise<void> {
    this.metrics = this.initializeMetrics();
  }

  /**
   * Stop monitoring
   */
  async stop(): Promise<void> {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = undefined;
    }
  }

  // Private methods

  private initializeMetrics(): LoadMetrics {
    return {
      filesProcessed: 0,
      totalRowsLoaded: 0,
      totalBytesProcessed: 0,
      averageRowsPerSecond: 0,
      averageProcessingTimeMs: 0,
      errorRate: 0,
      retryCount: 0,
      memoryPeakUsageMB: 0,
      databaseConnectionsUsed: 0,
      throughputMBps: 0,
      averageLatencyMs: 0,
    };
  }

  private startMetricsCollection(): void {
    if (!this.config.enableMetrics) {
      return;
    }

    this.metricsInterval = setInterval(async () => {
      await this.collectMetrics();
    }, this.config.metricsInterval);
  }

  private async collectMetrics(): Promise<void> {
    // Collect current system metrics
    const memoryUsage = process.memoryUsage();
    this.metrics.memoryPeakUsageMB = Math.max(
      this.metrics.memoryPeakUsageMB,
      memoryUsage.heapUsed / 1024 / 1024
    );

    // Update throughput calculations
    if (this.metrics.totalRowsLoaded > 0) {
      this.metrics.averageRowsPerSecond =
        this.metrics.totalRowsLoaded /
        (this.metrics.averageProcessingTimeMs / 1000);
    }

    // Log metrics if configured
    if (this.config.logLevel === "info") {
      await this.logMetrics(this.metrics);
    }
  }

  /**
   * Record file processing completion
   */
  async recordFileCompletion(
    fileKey: string,
    rowsLoaded: number,
    bytesProcessed: number,
    processingTimeMs: number,
    errors: LoadError[],
    warnings: LoadWarning[]
  ): Promise<void> {
    this.metrics.filesProcessed++;
    this.metrics.totalRowsLoaded += rowsLoaded;
    this.metrics.totalBytesProcessed += bytesProcessed;
    this.metrics.averageProcessingTimeMs =
      (this.metrics.averageProcessingTimeMs *
        (this.metrics.filesProcessed - 1) +
        processingTimeMs) /
      this.metrics.filesProcessed;
    this.metrics.errorRate = errors.length / Math.max(rowsLoaded, 1);
    this.metrics.throughputMBps = bytesProcessed / (processingTimeMs / 1000);

    // Clean up progress tracking
    this.progressMap.delete(fileKey);
  }

  /**
   * Record retry event
   */
  async recordRetry(): Promise<void> {
    this.metrics.retryCount++;
  }
}
