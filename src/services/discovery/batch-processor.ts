/**
 * Batch Processor
 * Handles batch selection, processing order optimization, and validation
 */

import type { FileDiscovery } from "./file-discovery";
import type { BatchProcessingOptions, ProcessingPlan } from "./types/discovery";
import type { FileBatch, DiscoveredFile } from "./types/files";

export class BatchProcessor {
  constructor(private fileDiscovery: FileDiscovery) {}

  async createProcessingPlan(
    options: BatchProcessingOptions
  ): Promise<ProcessingPlan> {
    try {
      // Discover files based on options
      const discoveredFiles = await this.fileDiscovery.discoverFiles({
        extractTypes: options.extractTypes,
      });

      // Group files into batches
      const allBatches = await this.fileDiscovery.groupByBatch(discoveredFiles);

      // Filter batches based on mode and options
      let selectedBatches = allBatches;

      if (options.mode === "latest") {
        // For latest mode, take the most recent batches
        if (options.maxBatches) {
          selectedBatches = allBatches.slice(0, options.maxBatches);
        }
      } else if (options.mode === "backfill" && options.dateRange) {
        // For backfill mode, filter by date range
        selectedBatches = allBatches.filter(
          (batch) =>
            batch.dateExtracted >= options.dateRange!.from &&
            batch.dateExtracted <= options.dateRange!.to
        );
      }

      // Calculate totals
      const totalFiles = selectedBatches.reduce(
        (sum, batch) => sum + batch.totalFiles,
        0
      );
      const totalSize = selectedBatches.reduce(
        (sum, batch) => sum + batch.totalSize,
        0
      );

      // Estimate processing duration (rough estimate: 1MB per second)
      const estimatedDuration = Math.ceil(totalSize / (1024 * 1024)); // seconds

      // Create processing order (optimize based on priority extract types)
      const processingOrder = this.createProcessingOrder(
        discoveredFiles,
        options
      );

      // Check for any warnings
      const warnings: string[] = [];
      if (selectedBatches.length === 0) {
        warnings.push("No batches found matching the specified criteria");
      }

      return {
        batches: selectedBatches,
        totalFiles,
        estimatedDuration,
        dependencies: [], // TODO: Implement dependency tracking
        processingOrder,
        warnings,
      };
    } catch (error) {
      throw new Error(
        `Failed to create processing plan: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async selectNextBatch(): Promise<FileBatch | null> {
    // TODO: Implement batch selection
    return null;
  }

  async validateBatch(batch: FileBatch): Promise<any> {
    // TODO: Implement batch validation
    return { isValid: true, errors: [], warnings: [] };
  }

  async markBatchStarted(batch: FileBatch): Promise<void> {
    // TODO: Implement batch start tracking
  }

  async markBatchCompleted(batch: FileBatch): Promise<void> {
    // TODO: Implement batch completion tracking
  }

  async optimizeProcessingOrder(files: any[]): Promise<any[]> {
    // TODO: Implement processing order optimization
    return files;
  }

  private createProcessingOrder(
    discoveredFiles: DiscoveredFile[],
    options: BatchProcessingOptions
  ): DiscoveredFile[] {
    // Sort files by priority extract types first, then by date
    const priorityOrder = ["Patients", "Appointments", "Providers"]; // Default priority

    return discoveredFiles.sort((a, b) => {
      // First, sort by extract type priority
      const aPriority =
        priorityOrder.indexOf(a.parsed.extractType) !== -1
          ? priorityOrder.indexOf(a.parsed.extractType)
          : priorityOrder.length;
      const bPriority =
        priorityOrder.indexOf(b.parsed.extractType) !== -1
          ? priorityOrder.indexOf(b.parsed.extractType)
          : priorityOrder.length;

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      // Then sort by date extracted (oldest first)
      return (
        a.parsed.dateExtracted.getTime() - b.parsed.dateExtracted.getTime()
      );
    });
  }
}
