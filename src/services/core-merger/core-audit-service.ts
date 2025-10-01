/**
 * Core Audit Service
 * Handles lineage tracking and audit trails for core merger operations
 */

import type { Pool } from "pg";
import type { CoreLineageRecord, SCD2AuditRecord } from "./types/audit";
import type { CoreMergeResult } from "./types/core-merger";
import { logger } from "../../utils/logger";

export class CoreAuditService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Record core lineage for a merge operation
   */
  async recordCoreLineage(lineage: CoreLineageRecord): Promise<void> {
    const query = `
      INSERT INTO etl.core_lineage (
        merge_run_id,
        load_run_id,
        extract_type,
        s3_version_id,
        file_hash,
        date_extracted,
        staging_records_processed,
        dimensions_created,
        dimensions_updated,
        dimensions_expired,
        facts_inserted,
        facts_updated,
        facts_skipped,
        integrity_violations,
        processing_start_time,
        processing_end_time,
        duration_ms,
        status,
        error_count
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
    `;

    const values = [
      lineage.mergeRunId,
      lineage.loadRunId,
      lineage.extractType,
      lineage.s3VersionId,
      lineage.fileHash,
      lineage.dateExtracted,
      lineage.stagingRecordsProcessed,
      lineage.dimensionsCreated,
      lineage.dimensionsUpdated,
      lineage.dimensionsExpired,
      lineage.factsInserted,
      lineage.factsUpdated,
      lineage.factsSkipped,
      lineage.integrityViolations,
      lineage.processingStartTime,
      lineage.processingEndTime,
      lineage.durationMs,
      lineage.status,
      lineage.errorCount,
    ];

    try {
      await this.pool.query(query, values);
      logger.debug("Recorded core lineage", { mergeRunId: lineage.mergeRunId });
    } catch (error) {
      logger.error("Failed to record core lineage", {
        error: error instanceof Error ? error.message : String(error),
        mergeRunId: lineage.mergeRunId,
      });
      // Don't throw - lineage tracking shouldn't fail the main process
    }
  }

  /**
   * Record SCD2 dimension change audit
   */
  async recordSCD2Change(audit: SCD2AuditRecord): Promise<void> {
    const query = `
      INSERT INTO etl.scd2_audit (
        audit_id,
        merge_run_id,
        dimension_type,
        business_key,
        change_type,
        attribute_changes,
        previous_record_id,
        new_record_id,
        changed_at,
        changed_by_load_run,
        change_reason,
        attribute_hash
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `;

    const values = [
      audit.auditId,
      audit.mergeRunId,
      audit.dimensionType,
      JSON.stringify(audit.businessKey),
      audit.changeType,
      JSON.stringify(audit.attributeChanges),
      audit.previousRecordId,
      audit.newRecordId,
      audit.changedAt,
      audit.changedByLoadRun,
      audit.changeReason,
      audit.attributeHash,
    ];

    try {
      await this.pool.query(query, values);
    } catch (error) {
      logger.error("Failed to record SCD2 audit", {
        error: error instanceof Error ? error.message : String(error),
        auditId: audit.auditId,
      });
    }
  }

  /**
   * Get lineage for a specific load run
   */
  async getLoadRunLineage(loadRunId: string): Promise<CoreLineageRecord[]> {
    const query = `
      SELECT *
      FROM etl.core_lineage
      WHERE load_run_id = $1
      ORDER BY processing_start_time DESC
    `;

    const result = await this.pool.query(query, [loadRunId]);
    return result.rows.map(this.rowToLineageRecord);
  }

  /**
   * Get SCD2 change history for a dimension
   */
  async getDimensionChangeHistory(
    businessKey: Record<string, unknown>,
    dimensionType: string
  ): Promise<SCD2AuditRecord[]> {
    const query = `
      SELECT *
      FROM etl.scd2_audit
      WHERE dimension_type = $1
        AND business_key = $2
      ORDER BY changed_at DESC
    `;

    const result = await this.pool.query(query, [
      dimensionType,
      JSON.stringify(businessKey),
    ]);

    return result.rows.map(this.rowToSCD2AuditRecord);
  }

  /**
   * Create lineage record from merge result
   */
  createLineageFromResult(
    mergeResult: CoreMergeResult,
    extractType: string,
    s3VersionId: string,
    fileHash: string,
    dateExtracted: string,
    stagingRecordsProcessed: number
  ): CoreLineageRecord {
    return {
      mergeRunId: mergeResult.mergeRunId,
      loadRunId: mergeResult.loadRunId,
      extractType,
      s3VersionId,
      fileHash,
      dateExtracted,
      stagingRecordsProcessed,
      dimensionsCreated: mergeResult.dimensionsCreated,
      dimensionsUpdated: mergeResult.dimensionsUpdated,
      dimensionsExpired: 0, // Would need to track separately
      factsInserted: mergeResult.factsInserted,
      factsUpdated: mergeResult.factsUpdated,
      factsSkipped: 0, // Would need to track separately
      integrityViolations: 0, // Would need to track from validator
      processingStartTime: mergeResult.startedAt,
      processingEndTime: mergeResult.completedAt ?? new Date(),
      durationMs: mergeResult.durationMs,
      status: mergeResult.status,
      errorCount: mergeResult.totalErrors,
    };
  }

  /**
   * Convert database row to LineageRecord
   */
  private rowToLineageRecord(row: any): CoreLineageRecord {
    return {
      mergeRunId: row.merge_run_id,
      loadRunId: row.load_run_id,
      extractType: row.extract_type,
      s3VersionId: row.s3_version_id,
      fileHash: row.file_hash,
      dateExtracted: row.date_extracted,
      stagingRecordsProcessed: row.staging_records_processed,
      dimensionsCreated: row.dimensions_created,
      dimensionsUpdated: row.dimensions_updated,
      dimensionsExpired: row.dimensions_expired,
      factsInserted: row.facts_inserted,
      factsUpdated: row.facts_updated,
      factsSkipped: row.facts_skipped,
      integrityViolations: row.integrity_violations,
      processingStartTime: row.processing_start_time,
      processingEndTime: row.processing_end_time,
      durationMs: row.duration_ms,
      status: row.status,
      errorCount: row.error_count,
    };
  }

  /**
   * Convert database row to SCD2AuditRecord
   */
  private rowToSCD2AuditRecord(row: any): SCD2AuditRecord {
    return {
      auditId: row.audit_id,
      mergeRunId: row.merge_run_id,
      dimensionType: row.dimension_type,
      businessKey: JSON.parse(row.business_key),
      changeType: row.change_type,
      attributeChanges: JSON.parse(row.attribute_changes),
      previousRecordId: row.previous_record_id,
      newRecordId: row.new_record_id,
      changedAt: row.changed_at,
      changedByLoadRun: row.changed_by_load_run,
      changeReason: row.change_reason,
      attributeHash: row.attribute_hash,
    };
  }
}
