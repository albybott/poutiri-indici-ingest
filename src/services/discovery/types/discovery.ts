/**
 * Discovery-related types
 */

import type { FileBatch, DiscoveredFile } from "./files";

export interface DiscoveryOptions {
  extractTypes?: string[]; // Filter by specific extract types
  dateFrom?: Date; // Filter files from date
  dateTo?: Date; // Filter files to date
  includeProcessed?: boolean; // Include already processed files
  maxBatches?: number; // Limit number of batches returned
}

export interface ProcessingPlan {
  batches: FileBatch[];
  totalFiles: number;
  estimatedDuration: number;
  dependencies: ExtractTypeDependency[];
  processingOrder: DiscoveredFile[];
  warnings: string[]; // Non-critical issues found
}

export interface BatchProcessingOptions {
  mode: "latest" | "backfill" | "specific";
  extractTypes?: string[];
  dateRange?: { from: Date; to: Date };
  specificBatch?: string;
  priorityOrder?: string[];
  skipValidation?: boolean; // For performance in large backfills
  maxBatches?: number; // Limit number of batches returned
}

export interface ExtractTypeDependency {
  extractType: string;
  dependsOn: string[];
  priority: number;
  estimatedProcessingTime: number; // Minutes
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
