import { db } from "../../db/client";
import { coreMergeRuns } from "../../db/schema/etl/audit";
import { eq } from "drizzle-orm";
import { BaseRunService } from "../shared/base-run-service";
import type {
  CreateCoreMergeRunParams,
  UpdateCoreMergeRunParams,
  CoreMergeRunRecord,
  CoreMergeRunStatusType,
} from "./types/core-merger";

/**
 * Core Merge Run Service - manages core_merge_runs table operations
 * Tracks the execution of core dimension and fact loading operations
 */
export class CoreMergeRunService extends BaseRunService<
  typeof coreMergeRuns,
  CreateCoreMergeRunParams,
  UpdateCoreMergeRunParams,
  CoreMergeRunRecord,
  CoreMergeRunStatusType
> {
  constructor() {
    super(db, coreMergeRuns);
  }

  /**
   * Create a new merge run record
   */
  async createRun(params: CreateCoreMergeRunParams): Promise<string> {
    const result = await this.db
      .insert(this.table)
      .values({
        loadRunId: params.loadRunId,
        extractType: params.extractType,
        status: "running",
        dimensionsCreated: 0,
        dimensionsUpdated: 0,
        factsInserted: 0,
        factsUpdated: 0,
      })
      .returning({ mergeRunId: this.table.mergeRunId });

    return result[0].mergeRunId;
  }

  /**
   * Update an existing merge run record
   */
  async updateRun(
    runId: string,
    params: UpdateCoreMergeRunParams
  ): Promise<void> {
    const updateValues: Record<string, any> = this.buildUpdateValues({});

    if (params.status !== undefined) {
      updateValues.status = params.status;
    }
    if (params.completedAt !== undefined) {
      updateValues.completedAt = params.completedAt;
    }
    if (params.dimensionsCreated !== undefined) {
      updateValues.dimensionsCreated = params.dimensionsCreated;
    }
    if (params.dimensionsUpdated !== undefined) {
      updateValues.dimensionsUpdated = params.dimensionsUpdated;
    }
    if (params.factsInserted !== undefined) {
      updateValues.factsInserted = params.factsInserted;
    }
    if (params.factsUpdated !== undefined) {
      updateValues.factsUpdated = params.factsUpdated;
    }
    if (params.error !== undefined) {
      updateValues.error = params.error;
    }
    if (params.result !== undefined) {
      updateValues.result = params.result;
    }

    await this.db
      .update(this.table)
      .set(updateValues)
      .where(eq(this.table.mergeRunId, runId));
  }

  /**
   * Get merge run record details
   */
  async getRun(runId: string): Promise<CoreMergeRunRecord | null> {
    const results = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.mergeRunId, runId))
      .limit(1);

    return results.length > 0 ? (results[0] as CoreMergeRunRecord) : null;
  }

  /**
   * Mark merge run as completed successfully with final statistics
   */
  async completeRun(runId: string, stats: Record<string, any>): Promise<void> {
    await this.updateRun(runId, {
      status: "completed",
      completedAt: new Date(),
      result: JSON.stringify(stats), // Store full result
      ...stats,
    });
  }

  /**
   * Mark merge run as failed with error message
   */
  async failRun(
    runId: string,
    errorMessage: string,
    stats?: Record<string, any>
  ): Promise<void> {
    await this.updateRun(runId, {
      status: "failed",
      completedAt: new Date(),
      error: errorMessage,
      ...stats,
    });
  }

  /**
   * Check if a merge run already exists for the given load run and extract type
   * Used for idempotency - ensures only one successful merge per load run per extract type
   */
  async getExistingMergeRun(
    loadRunId: string,
    extractType: string
  ): Promise<CoreMergeRunRecord | null> {
    const results = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.loadRunId, loadRunId))
      .where(eq(this.table.extractType, extractType))
      .where(eq(this.table.status, "completed"))
      .limit(1);

    return results.length > 0 ? (results[0] as CoreMergeRunRecord) : null;
  }

  /**
   * Get all merge runs for a specific load run
   */
  async getMergeRunsByLoadRun(
    loadRunId: string
  ): Promise<CoreMergeRunRecord[]> {
    const results = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.loadRunId, loadRunId))
      .orderBy(this.table.startedAt);

    return results as CoreMergeRunRecord[];
  }

  // Legacy method aliases for backward compatibility
  async createMergeRun(params: CreateCoreMergeRunParams): Promise<string> {
    return this.createRun(params);
  }

  async updateMergeRun(
    runId: string,
    params: UpdateCoreMergeRunParams
  ): Promise<void> {
    return this.updateRun(runId, params);
  }

  async completeMergeRun(
    runId: string,
    stats: Record<string, any>
  ): Promise<void> {
    return this.completeRun(runId, stats);
  }

  async failMergeRun(
    runId: string,
    errorMessage: string,
    stats?: Record<string, any>
  ): Promise<void> {
    return this.failRun(runId, errorMessage, stats);
  }

  async getMergeRun(runId: string): Promise<CoreMergeRunRecord | null> {
    return this.getRun(runId);
  }
}
