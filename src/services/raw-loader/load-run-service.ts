import { db } from "../../db/client";
import { loadRuns } from "../../db/schema/etl/audit";
import { eq } from "drizzle-orm";
import { BaseRunService } from "../shared/base-run-service";
import type {
  CreateLoadRunParams,
  UpdateLoadRunParams,
  LoadRunRecord,
  LoadRunStatus,
} from "./types/raw-loader";

/**
 * Load Run Service - manages load_runs table operations
 * A load run represents one execution of the ETL pipeline
 */
export class LoadRunService extends BaseRunService<
  typeof loadRuns,
  CreateLoadRunParams,
  UpdateLoadRunParams,
  LoadRunRecord,
  LoadRunStatus
> {
  constructor() {
    super(db, loadRuns);
  }

  /**
   * Create a new run record
   */
  async createRun(params: CreateLoadRunParams): Promise<string> {
    const result = await this.db
      .insert(loadRuns)
      .values({
        status: "running",
        triggeredBy: params.triggeredBy,
        notes: params.notes,
        totalFilesProcessed: 0,
        totalRowsIngested: 0,
        totalRowsRejected: 0,
      })
      .returning({ loadRunId: loadRuns.loadRunId });

    return result[0].loadRunId;
  }

  /**
   * Update an existing run record
   */
  async updateRun(runId: string, params: UpdateLoadRunParams): Promise<void> {
    const updateValues: Record<string, any> = this.buildUpdateValues({});

    if (params.status !== undefined) {
      updateValues.status = params.status;
    }
    if (params.completedAt !== undefined) {
      updateValues.completedAt = params.completedAt;
    }
    if (params.totalFilesProcessed !== undefined) {
      updateValues.totalFilesProcessed = params.totalFilesProcessed;
    }
    if (params.totalRowsIngested !== undefined) {
      updateValues.totalRowsIngested = params.totalRowsIngested;
    }
    if (params.totalRowsRejected !== undefined) {
      updateValues.totalRowsRejected = params.totalRowsRejected;
    }
    if (params.notes !== undefined) {
      updateValues.notes = params.notes;
    }

    await this.db
      .update(this.table)
      .set(updateValues)
      .where(eq(this.table.loadRunId, runId));
  }

  /**
   * Get run record details
   */
  async getRun(runId: string): Promise<LoadRunRecord | null> {
    const results = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.loadRunId, runId))
      .limit(1);

    return results.length > 0 ? (results[0] as LoadRunRecord) : null;
  }

  /**
   * Increment file count for a load run
   */
  async incrementFileCount(runId: string): Promise<void> {
    await this.incrementCounter(runId, "totalFilesProcessed");
  }

  /**
   * Add rows to load run statistics
   */
  async addRowStats(
    runId: string,
    rowsIngested: number,
    rowsRejected: number
  ): Promise<void> {
    await this.addStats(runId, {
      totalRowsIngested: rowsIngested,
      totalRowsRejected: rowsRejected,
    });
  }

  // Legacy method aliases for backward compatibility
  async createLoadRun(params: CreateLoadRunParams): Promise<string> {
    return this.createRun(params);
  }

  async updateLoadRun(
    runId: string,
    params: UpdateLoadRunParams
  ): Promise<void> {
    return this.updateRun(runId, params);
  }

  async completeLoadRun(
    runId: string,
    stats: {
      totalFilesProcessed: number;
      totalRowsIngested: number;
      totalRowsRejected: number;
    }
  ): Promise<void> {
    return this.completeRun(runId, stats);
  }

  async failLoadRun(
    runId: string,
    errorMessage: string,
    stats?: {
      totalFilesProcessed?: number;
      totalRowsIngested?: number;
      totalRowsRejected?: number;
    }
  ): Promise<void> {
    return this.failRun(runId, errorMessage, stats);
  }

  async cancelLoadRun(runId: string, reason?: string): Promise<void> {
    return this.cancelRun(runId, reason);
  }

  async getLoadRun(runId: string): Promise<LoadRunRecord | null> {
    return this.getRun(runId);
  }
}
