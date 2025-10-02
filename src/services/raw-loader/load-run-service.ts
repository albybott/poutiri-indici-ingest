import { db } from "../../db/client";
import { loadRuns } from "../../db/schema/etl/audit";
import { eq } from "drizzle-orm";
import type {
  CreateLoadRunParams,
  UpdateLoadRunParams,
  LoadRunRecord,
} from "./types/raw-loader";
/**
 * Load Run Service - manages load_runs table operations
 * A load run represents one execution of the ETL pipeline
 */
export class LoadRunService {
  /**
   * Create a new load run record
   */
  async createLoadRun(params: CreateLoadRunParams): Promise<string> {
    const result = await db
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
   * Update an existing load run record
   */
  async updateLoadRun(
    loadRunId: string,
    params: UpdateLoadRunParams
  ): Promise<void> {
    const updateValues: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (params.status !== undefined) {
      updateValues.status = params.status;
    }
    if (params.finishedAt !== undefined) {
      updateValues.finishedAt = params.finishedAt;
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

    await db
      .update(loadRuns)
      .set(updateValues)
      .where(eq(loadRuns.loadRunId, loadRunId));
  }

  /**
   * Mark load run as completed successfully
   */
  async completeLoadRun(
    loadRunId: string,
    stats: {
      totalFilesProcessed: number;
      totalRowsIngested: number;
      totalRowsRejected: number;
    }
  ): Promise<void> {
    await this.updateLoadRun(loadRunId, {
      status: "completed",
      finishedAt: new Date(),
      ...stats,
    });
  }

  /**
   * Mark load run as failed
   */
  async failLoadRun(
    loadRunId: string,
    errorMessage: string,
    stats?: {
      totalFilesProcessed?: number;
      totalRowsIngested?: number;
      totalRowsRejected?: number;
    }
  ): Promise<void> {
    await this.updateLoadRun(loadRunId, {
      status: "failed",
      finishedAt: new Date(),
      notes: errorMessage,
      ...stats,
    });
  }

  /**
   * Mark load run as cancelled
   */
  async cancelLoadRun(loadRunId: string, reason?: string): Promise<void> {
    await this.updateLoadRun(loadRunId, {
      status: "cancelled",
      finishedAt: new Date(),
      notes: reason,
    });
  }

  /**
   * Get load run details
   */
  async getLoadRun(loadRunId: string): Promise<LoadRunRecord | null> {
    const results = await db
      .select()
      .from(loadRuns)
      .where(eq(loadRuns.loadRunId, loadRunId))
      .limit(1);

    return results.length > 0 ? (results[0] as LoadRunRecord) : null;
  }

  /**
   * Increment file count for a load run
   */
  async incrementFileCount(loadRunId: string): Promise<void> {
    const current = await this.getLoadRun(loadRunId);
    if (current) {
      await this.updateLoadRun(loadRunId, {
        totalFilesProcessed: current.totalFilesProcessed + 1,
      });
    }
  }

  /**
   * Add rows to load run statistics
   */
  async addRowStats(
    loadRunId: string,
    rowsIngested: number,
    rowsRejected: number
  ): Promise<void> {
    const current = await this.getLoadRun(loadRunId);
    if (current) {
      await this.updateLoadRun(loadRunId, {
        totalRowsIngested: current.totalRowsIngested + rowsIngested,
        totalRowsRejected: current.totalRowsRejected + rowsRejected,
      });
    }
  }
}
