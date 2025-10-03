/**
 * Shared interfaces for ETL run services
 * Provides consistent contracts across all ETL stage run management
 */

/**
 * Generic run service interface that all ETL stage run services implement
 * Ensures consistent API across load runs, merge runs, staging runs, etc.
 */
export interface IRunService<
  TCreateParams,
  TUpdateParams,
  TRecord,
  TStatus extends string = string,
> {
  /**
   * Create a new run record and return its ID
   */
  createRun(params: TCreateParams): Promise<string>;

  /**
   * Update an existing run record
   */
  updateRun(runId: string, params: TUpdateParams): Promise<void>;

  /**
   * Mark run as completed successfully with final statistics
   */
  completeRun(runId: string, stats: Record<string, any>): Promise<void>;

  /**
   * Mark run as failed with error message and optional partial statistics
   */
  failRun(
    runId: string,
    errorMessage: string,
    stats?: Record<string, any>
  ): Promise<void>;

  /**
   * Mark run as cancelled with optional reason
   */
  cancelRun(runId: string, reason?: string): Promise<void>;

  /**
   * Get run record details
   */
  getRun(runId: string): Promise<TRecord | null>;

  /**
   * Get current status of a run
   */
  getRunStatus(runId: string): Promise<TStatus | null>;

  /**
   * Increment a counter field for a run (e.g., files processed, rows handled)
   */
  incrementCounter(
    runId: string,
    field: string,
    amount?: number
  ): Promise<void>;

  /**
   * Add statistics to a run (e.g., batch row counts)
   */
  addStats(runId: string, stats: Record<string, number>): Promise<void>;
}
