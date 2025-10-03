import { db } from "../../db/client";
import { stagingRuns } from "../../db/schema/etl/audit";
import { eq } from "drizzle-orm";
import { BaseRunService } from "../shared/base-run-service";
import type {
  CreateStagingRunParams,
  UpdateStagingRunParams,
  StagingRunRecord,
  StagingRunStatus,
} from "./types/transformer";

/**
 * Staging Run Service - manages staging_runs table operations
 * Tracks the execution of raw to staging data transformation operations
 */
export class StagingRunService extends BaseRunService<
  typeof stagingRuns,
  CreateStagingRunParams,
  UpdateStagingRunParams,
  StagingRunRecord,
  StagingRunStatus
> {
  constructor() {
    super(db, stagingRuns);
  }

  /**
   * Create a new staging run record
   */
  async createRun(params: CreateStagingRunParams): Promise<string> {
    const result = await this.db
      .insert(this.table)
      .values({
        loadRunId: params.loadRunId,
        extractType: params.extractType,
        sourceTable: params.sourceTable,
        targetTable: params.targetTable,
        status: "running",
        totalRowsRead: 0,
        totalRowsTransformed: 0,
        totalRowsRejected: 0,
        totalRowsDeduplicated: 0,
        successfulBatches: 0,
        failedBatches: 0,
      })
      .returning({ stagingRunId: this.table.stagingRunId });

    return result[0].stagingRunId;
  }

  /**
   * Update an existing staging run record
   */
  async updateRun(
    runId: string,
    params: UpdateStagingRunParams
  ): Promise<void> {
    const updateValues: Record<string, any> = this.buildUpdateValues({});

    if (params.status !== undefined) {
      updateValues.status = params.status;
    }
    if (params.completedAt !== undefined) {
      updateValues.completedAt = params.completedAt;
    }
    if (params.totalRowsRead !== undefined) {
      updateValues.totalRowsRead = params.totalRowsRead;
    }
    if (params.totalRowsTransformed !== undefined) {
      updateValues.totalRowsTransformed = params.totalRowsTransformed;
    }
    if (params.totalRowsRejected !== undefined) {
      updateValues.totalRowsRejected = params.totalRowsRejected;
    }
    if (params.totalRowsDeduplicated !== undefined) {
      updateValues.totalRowsDeduplicated = params.totalRowsDeduplicated;
    }
    if (params.successfulBatches !== undefined) {
      updateValues.successfulBatches = params.successfulBatches;
    }
    if (params.failedBatches !== undefined) {
      updateValues.failedBatches = params.failedBatches;
    }
    if (params.durationMs !== undefined) {
      updateValues.durationMs = params.durationMs;
    }
    if (params.rowsPerSecond !== undefined) {
      updateValues.rowsPerSecond = params.rowsPerSecond;
    }
    if (params.memoryUsageMB !== undefined) {
      updateValues.memoryUsageMB = params.memoryUsageMB;
    }
    if (params.error !== undefined) {
      updateValues.error = params.error;
    }
    if (params.result !== undefined) {
      updateValues.result = params.result;
    }

    try {
      const result = await this.db
        .update(this.table)
        .set(updateValues)
        .where(eq(this.table.stagingRunId, runId))
        .returning();

      if (result.length === 0) {
        console.error(
          `❌ No rows updated for staging run ${runId} - record may not exist`
        );
      }
    } catch (error) {
      console.error(
        `❌ Database update failed for staging run ${runId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get staging run record details
   */
  async getRun(runId: string): Promise<StagingRunRecord | null> {
    const results = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.stagingRunId, runId))
      .limit(1);

    return results.length > 0 ? (results[0] as StagingRunRecord) : null;
  }

  /**
   * Mark staging run as completed successfully with final statistics
   */
  async completeRun(runId: string, stats: Record<string, any>): Promise<void> {
    console.log(
      `🔄 Completing staging run ${runId} with completedAt: ${new Date().toISOString()}`
    );
    await this.updateRun(runId, {
      status: "completed",
      completedAt: new Date(),
      result: JSON.stringify(stats), // Store full result
      ...stats,
    });
    console.log(`✅ Staging run ${runId} completed successfully`);
  }

  /**
   * Mark staging run as failed with error message
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
   * Check if a staging run already exists for the given load run and extract type
   * Used for idempotency - ensures only one successful staging run per load run per extract type
   */
  async getExistingStagingRun(
    loadRunId: string,
    extractType: string
  ): Promise<StagingRunRecord | null> {
    const results = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.loadRunId, loadRunId))
      .where(eq(this.table.extractType, extractType))
      .where(eq(this.table.status, "completed"))
      .limit(1);

    return results.length > 0 ? (results[0] as StagingRunRecord) : null;
  }

  /**
   * Get all staging runs for a specific load run
   */
  async getStagingRunsByLoadRun(
    loadRunId: string
  ): Promise<StagingRunRecord[]> {
    const results = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.loadRunId, loadRunId))
      .orderBy(this.table.startedAt);

    return results as StagingRunRecord[];
  }

  // Legacy method aliases for backward compatibility
  async createStagingRun(params: CreateStagingRunParams): Promise<string> {
    return this.createRun(params);
  }

  async updateStagingRun(
    runId: string,
    params: UpdateStagingRunParams
  ): Promise<void> {
    return this.updateRun(runId, params);
  }

  async completeStagingRun(
    runId: string,
    stats: Record<string, any>
  ): Promise<void> {
    return this.completeRun(runId, stats);
  }

  async failStagingRun(
    runId: string,
    errorMessage: string,
    stats?: Record<string, any>
  ): Promise<void> {
    return this.failRun(runId, errorMessage, stats);
  }

  async getStagingRun(runId: string): Promise<StagingRunRecord | null> {
    return this.getRun(runId);
  }
}
