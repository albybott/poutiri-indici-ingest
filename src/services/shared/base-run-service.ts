import { eq } from "drizzle-orm";
import type { Table } from "drizzle-orm";
import { db } from "../../db/client";
import type { IRunService } from "./interfaces/run-service";

/**
 * Base run service providing common functionality for all ETL stage run services
 * Implements shared patterns while allowing customization for specific run types
 */
export abstract class BaseRunService<
  TTable extends Table,
  TCreateParams,
  TUpdateParams,
  TRecord,
  TStatus extends string = string,
> implements IRunService<TCreateParams, TUpdateParams, TRecord, TStatus>
{
  protected constructor(
    protected db: typeof db,
    protected table: TTable
  ) {}

  // Abstract methods that must be implemented by subclasses
  abstract createRun(params: TCreateParams): Promise<string>;
  abstract updateRun(runId: string, params: TUpdateParams): Promise<void>;
  abstract getRun(runId: string): Promise<TRecord | null>;

  // Common implementations with default behavior

  /**
   * Mark run as completed successfully with final statistics
   * Subclasses can override for stage-specific completion logic
   */
  async completeRun(runId: string, stats: Record<string, any>): Promise<void> {
    await this.updateRun(runId, {
      status: "completed",
      finishedAt: new Date(),
      ...stats,
    } as any);
  }

  /**
   * Mark run as failed with error message and optional partial statistics
   * Subclasses can override for stage-specific error handling
   */
  async failRun(
    runId: string,
    errorMessage: string,
    stats?: Record<string, any>
  ): Promise<void> {
    await this.updateRun(runId, {
      status: "failed",
      finishedAt: new Date(),
      notes: errorMessage,
      ...stats,
    } as any);
  }

  /**
   * Mark run as cancelled with optional reason
   * Subclasses can override for stage-specific cancellation logic
   */
  async cancelRun(runId: string, reason?: string): Promise<void> {
    await this.updateRun(runId, {
      status: "cancelled",
      finishedAt: new Date(),
      notes: reason,
    } as any);
  }

  /**
   * Get current status of a run
   */
  async getRunStatus(runId: string): Promise<TStatus | null> {
    const run = await this.getRun(runId);
    return run?.status ?? null;
  }

  /**
   * Increment a counter field for a run (e.g., files processed, rows handled)
   * Uses a read-then-write pattern for atomic increments
   */
  async incrementCounter(
    runId: string,
    field: string,
    amount: number = 1
  ): Promise<void> {
    const current = await this.getRun(runId);
    if (current && field in current) {
      const currentValue = (current as any)[field] || 0;
      await this.updateRun(runId, {
        [field]: currentValue + amount,
      } as any);
    }
  }

  /**
   * Add statistics to a run (e.g., batch row counts)
   * Adds multiple numeric fields atomically
   */
  async addStats(runId: string, stats: Record<string, number>): Promise<void> {
    const current = await this.getRun(runId);
    if (current) {
      const updateValues: Record<string, any> = {};

      for (const [field, increment] of Object.entries(stats)) {
        if (field in current) {
          const currentValue = (current as any)[field] || 0;
          updateValues[field] = currentValue + increment;
        }
      }

      if (Object.keys(updateValues).length > 0) {
        await this.updateRun(runId, updateValues);
      }
    }
  }

  /**
   * Helper method to get the primary key field name from the table
   * Assumes the first column is the primary key (common pattern)
   */
  protected getPrimaryKeyField(): string {
    const columns = Object.keys(this.table);
    return columns[0]; // Usually the first column is the primary key
  }

  /**
   * Helper method to build update values with automatic updatedAt timestamp
   */
  protected buildUpdateValues(
    params: Partial<Record<string, any>>
  ): Record<string, any> {
    return {
      updatedAt: new Date(),
      ...params,
    };
  }
}
