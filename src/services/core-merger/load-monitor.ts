/**
 * Load Monitor
 * Tracks progress and performance metrics for core merger operations
 */

import type { LoadProgress } from "./types/core-merger";
import type { DimensionType } from "./types/scd2";
import type { FactType } from "./types/fact";
import { logger } from "@/services/shared/utils/logger";

export class LoadMonitor {
  private progressMap: Map<string, LoadProgress>;
  private startTimes: Map<string, Date>;
  private itemCounts: Map<string, { processed: number; total: number }>;

  constructor() {
    this.progressMap = new Map();
    this.startTimes = new Map();
    this.itemCounts = new Map();
  }

  /**
   * Start monitoring a load operation
   */
  startMonitoring(
    mergeRunId: string,
    totalItems: number,
    phase: "dimensions" | "facts" | "validation" | "complete" = "dimensions"
  ): void {
    const now = new Date();
    this.startTimes.set(mergeRunId, now);
    this.itemCounts.set(mergeRunId, { processed: 0, total: totalItems });

    const progress: LoadProgress = {
      phase,
      totalItems,
      processedItems: 0,
      percentComplete: 0,
      currentRate: 0,
      startedAt: now,
      updatedAt: now,
    };

    this.progressMap.set(mergeRunId, progress);

    logger.info(`Started monitoring merge run: ${mergeRunId}`, {
      totalItems,
      phase,
    });
  }

  /**
   * Update progress
   */
  updateProgress(
    mergeRunId: string,
    processedItems: number,
    currentDimension?: DimensionType,
    currentFact?: FactType
  ): void {
    const progress = this.progressMap.get(mergeRunId);
    if (!progress) {
      logger.warn(`No progress tracking found for merge run: ${mergeRunId}`);
      return;
    }

    const now = new Date();
    const elapsed = now.getTime() - progress.startedAt.getTime();
    const currentRate = elapsed > 0 ? (processedItems / elapsed) * 1000 : 0;

    const percentComplete =
      progress.totalItems > 0
        ? (processedItems / progress.totalItems) * 100
        : 0;

    const remaining = progress.totalItems - processedItems;
    const estimatedTimeRemaining =
      currentRate > 0 ? (remaining / currentRate) * 1000 : undefined;

    const updatedProgress: LoadProgress = {
      ...progress,
      processedItems,
      percentComplete,
      currentRate,
      currentDimension,
      currentFact,
      estimatedTimeRemaining,
      updatedAt: now,
    };

    this.progressMap.set(mergeRunId, updatedProgress);
    this.itemCounts.set(mergeRunId, {
      processed: processedItems,
      total: progress.totalItems,
    });
  }

  /**
   * Update phase
   */
  updatePhase(
    mergeRunId: string,
    phase: "dimensions" | "facts" | "validation" | "complete"
  ): void {
    const progress = this.progressMap.get(mergeRunId);
    if (!progress) {
      return;
    }

    progress.phase = phase;
    progress.updatedAt = new Date();
    this.progressMap.set(mergeRunId, progress);

    logger.info(`Updated phase for merge run: ${mergeRunId}`, { phase });
  }

  /**
   * Get progress for a merge run
   */
  getProgress(mergeRunId: string): LoadProgress | undefined {
    return this.progressMap.get(mergeRunId);
  }

  /**
   * Complete monitoring
   */
  completeMonitoring(mergeRunId: string): void {
    const progress = this.progressMap.get(mergeRunId);
    if (!progress) {
      return;
    }

    progress.phase = "complete";
    progress.percentComplete = 100;
    progress.updatedAt = new Date();
    this.progressMap.set(mergeRunId, progress);

    const duration =
      progress.updatedAt.getTime() - progress.startedAt.getTime();

    logger.info(`Completed monitoring merge run: ${mergeRunId}`, {
      totalItems: progress.totalItems,
      processedItems: progress.processedItems,
      durationMs: duration,
    });

    // Clean up after a delay
    setTimeout(() => {
      this.progressMap.delete(mergeRunId);
      this.startTimes.delete(mergeRunId);
      this.itemCounts.delete(mergeRunId);
    }, 60000); // Keep for 1 minute after completion
  }

  /**
   * Get all active monitoring sessions
   */
  getActiveMonitoring(): Map<string, LoadProgress> {
    return new Map(this.progressMap);
  }

  /**
   * Log progress summary
   */
  logProgressSummary(mergeRunId: string): void {
    const progress = this.progressMap.get(mergeRunId);
    if (!progress) {
      return;
    }

    logger.info(`Progress summary for ${mergeRunId}`, {
      phase: progress.phase,
      percentComplete: progress.percentComplete.toFixed(1),
      processedItems: progress.processedItems,
      totalItems: progress.totalItems,
      currentRate: Math.round(progress.currentRate),
      estimatedTimeRemaining: progress.estimatedTimeRemaining
        ? Math.round(progress.estimatedTimeRemaining / 1000)
        : undefined,
    });
  }
}
