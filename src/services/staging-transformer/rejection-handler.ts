/**
 * Rejection Handler
 * Manages rejected rows and writes them to rejection tables for analysis
 */

import type { RejectedRow } from "./types/transformer";
import type { ValidationConfig } from "./types/config";
import type { DatabasePool } from "@/services/shared/database-pool";

/**
 * Options for storing rejected rows
 */
export interface RejectionStorageOptions {
  rejectionTable: string; // Table to store rejections (e.g., "etl.staging_rejections")
  extractType: string; // Extract type being processed
  loadRunId: string; // Load run identifier
}

/**
 * Handler for managing rejected rows during staging transformation
 */
export class RejectionHandler {
  constructor(
    private dbPool: DatabasePool,
    private config: ValidationConfig
  ) {}

  /**
   * Store rejected rows in the rejection table
   */
  async storeRejections(
    rejections: RejectedRow[],
    options: RejectionStorageOptions
  ): Promise<void> {
    if (!this.config.rejectInvalidRows || rejections.length === 0) {
      return;
    }

    try {
      // Build batch insert for rejections
      const values = rejections.map((rejection) => [
        options.loadRunId,
        options.extractType,
        rejection.rowNumber,
        rejection.sourceRowId || null,
        rejection.rejectionReason,
        this.config.trackRejectionReasons
          ? JSON.stringify(rejection.failedValidations)
          : null,
        rejection.rawData ? JSON.stringify(rejection.rawData) : null,
        rejection.timestamp,
      ]);

      const placeholders = values
        .map(
          (_, i) =>
            `($${i * 8 + 1}, $${i * 8 + 2}, $${i * 8 + 3}, $${i * 8 + 4}, $${i * 8 + 5}, $${i * 8 + 6}, $${i * 8 + 7}, $${i * 8 + 8})`
        )
        .join(", ");

      const query = `
        INSERT INTO ${options.rejectionTable} (
          load_run_id,
          extract_type,
          row_number,
          source_row_id,
          rejection_reason,
          validation_failures,
          raw_data,
          rejected_at
        )
        VALUES ${placeholders}
      `;

      await this.dbPool.query(query, values.flat());

      console.log(
        `📝 Stored ${rejections.length} rejected rows in ${options.rejectionTable}`
      );
    } catch (error) {
      console.error("❌ Failed to store rejections:", error);
      throw error;
    }
  }

  /**
   * Build rejection summary for reporting
   */
  buildRejectionSummary(rejections: RejectedRow[]): {
    totalRejections: number;
    byReason: Record<string, number>;
    byColumn: Record<string, number>;
    topReasons: Array<{ reason: string; count: number }>;
  } {
    const totalRejections = rejections.length;
    const byReason: Record<string, number> = {};
    const byColumn: Record<string, number> = {};

    for (const rejection of rejections) {
      // Count by rejection reason
      byReason[rejection.rejectionReason] =
        (byReason[rejection.rejectionReason] || 0) + 1;

      // Count by failing column
      for (const failure of rejection.failedValidations) {
        byColumn[failure.columnName] = (byColumn[failure.columnName] || 0) + 1;
      }
    }

    // Get top reasons
    const topReasons = Object.entries(byReason)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalRejections,
      byReason,
      byColumn,
      topReasons,
    };
  }

  /**
   * Check if rejection threshold has been exceeded
   */
  shouldStopOnRejectionRate(
    totalRows: number,
    rejectedRows: number,
    maxRejectionRatePercent = 10
  ): boolean {
    if (totalRows === 0) return false;

    const rejectionRate = (rejectedRows / totalRows) * 100;
    return rejectionRate > maxRejectionRatePercent;
  }

  /**
   * Create rejection table if it doesn't exist
   */
  async ensureRejectionTableExists(tableName: string): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        rejection_id SERIAL PRIMARY KEY,
        load_run_id UUID NOT NULL,
        extract_type TEXT NOT NULL,
        row_number INTEGER,
        source_row_id TEXT,
        rejection_reason TEXT NOT NULL,
        validation_failures JSONB,
        raw_data JSONB,
        rejected_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_${tableName.split(".").pop()}_load_run_id
        ON ${tableName}(load_run_id);

      CREATE INDEX IF NOT EXISTS idx_${tableName.split(".").pop()}_extract_type
        ON ${tableName}(extract_type);

      CREATE INDEX IF NOT EXISTS idx_${tableName.split(".").pop()}_rejected_at
        ON ${tableName}(rejected_at);
    `;

    try {
      await this.dbPool.query(query);
      console.log(`✅ Rejection table ${tableName} ready`);
    } catch (error) {
      console.error(`❌ Failed to create rejection table ${tableName}:`, error);
      throw error;
    }
  }
}
