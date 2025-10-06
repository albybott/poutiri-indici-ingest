/**
 * Base Dimension Handler
 * Abstract class for dimension-specific loading logic
 */

import type { DimensionHandlerConfig } from "../../types/dimension";
import type {
  SCD2Config,
  DimensionType,
  LineageMetadata,
  DimensionRecord,
} from "../../types/scd2";
import { logger } from "@/services/shared/utils/logger";

export abstract class BaseDimensionHandler {
  protected config: DimensionHandlerConfig;
  protected scd2Config: SCD2Config;

  constructor(config: DimensionHandlerConfig, scd2Config: SCD2Config) {
    this.config = config;
    this.scd2Config = scd2Config;
  }

  /**
   * Get dimension type
   */
  abstract getDimensionType(): DimensionType;

  /**
   * Get source table name
   */
  getSourceTable(): string {
    return this.config.sourceTable;
  }

  /**
   * Get target table name
   */
  getTargetTable(): string {
    return this.config.targetTable;
  }

  /**
   * Get business key fields
   */
  getBusinessKeyFields(): string[] {
    return this.config.businessKeyFields;
  }

  /**
   * Transform staging record to dimension record
   */
  async transformStagingToDimension(
    stagingRecord: Record<string, unknown>,
    lineage: LineageMetadata
  ): Promise<DimensionRecord> {
    // Extract business key
    const businessKey: Record<string, unknown> = {};
    for (const field of this.config.businessKeyFields) {
      businessKey[field] = stagingRecord[field];
    }

    // Transform attributes using field mappings
    const attributes: Record<string, unknown> = {};
    for (const mapping of this.config.fieldMappings) {
      const sourceValue = stagingRecord[mapping.sourceField];

      // Handle null/undefined
      if (sourceValue === null || sourceValue === undefined) {
        if (mapping.required && mapping.defaultValue === undefined) {
          throw new Error(
            `Required field '${mapping.sourceField}' is null/undefined`
          );
        }
        attributes[mapping.targetField] = mapping.defaultValue ?? null;
        continue;
      }

      // Apply transformation if provided
      const transformedValue = mapping.transform
        ? mapping.transform(sourceValue)
        : sourceValue;

      attributes[mapping.targetField] = transformedValue;
    }

    // Create dimension record
    return {
      businessKey,
      practiceId: String(stagingRecord.practiceId),
      perOrgId: String(stagingRecord.perOrgId),
      effectiveFrom: new Date(),
      effectiveTo: null,
      isCurrent: true,
      attributes,
      lineage,
    };
  }

  /**
   * Validate staging record
   */
  async validateStagingRecord(
    record: Record<string, unknown>
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check business key fields
    for (const field of this.config.businessKeyFields) {
      if (
        !(field in record) ||
        record[field] === null ||
        record[field] === undefined
      ) {
        errors.push(`Business key field '${field}' is missing or null`);
      }
    }

    // Check required fields
    for (const mapping of this.config.fieldMappings) {
      if (mapping.required) {
        const value = record[mapping.sourceField];
        if (value === null || value === undefined) {
          if (mapping.defaultValue === undefined) {
            errors.push(
              `Required field '${mapping.sourceField}' is missing or null`
            );
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Build SELECT query for reading staging data
   * Joins with load_run_files to get load_run_id
   */
  buildSelectQuery(loadRunId: string): string {
    const businessKeyFields = this.config.businessKeyFields.map(
      (f) => `stg.${f}`
    );
    const fieldMappings = this.config.fieldMappings.map(
      (m) => `stg.${m.targetField}`
    );

    const allColumns = [
      ...businessKeyFields,
      ...fieldMappings,
      "lrf.load_run_id",
    ];

    return `
      SELECT ${allColumns.join(", ")}
      FROM ${this.config.sourceTable} stg
      INNER JOIN etl.load_run_files lrf ON stg.load_run_file_id = lrf.load_run_file_id
      WHERE lrf.load_run_id = $1
      ORDER BY ${businessKeyFields.join(", ")}
    `;
  }

  /**
   * Build INSERT query for new dimension records
   */
  buildInsertQuery(): string {
    const columnNames: string[] = [];
    const placeholders: string[] = [];
    let paramIndex = 1;

    // Business keys
    for (const field of this.config.businessKeyFields) {
      // console.log("Processing business key --:", { field, type: typeof field });

      columnNames.push(this.toSnakeCase(field));
      placeholders.push(`$${paramIndex++}`);
    }

    // Attribute columns
    for (const mapping of this.config.fieldMappings) {
      // console.log("Processing targetField key --:", {
      //   targetField: mapping.targetField,
      //   type: typeof mapping.targetField,
      // });

      if (!columnNames.includes(this.toSnakeCase(mapping.targetField))) {
        columnNames.push(this.toSnakeCase(mapping.targetField));
        placeholders.push(`$${paramIndex++}`);
      }
    }

    // SCD2 columns
    columnNames.push("effective_from", "effective_to", "is_current");
    placeholders.push(
      `$${paramIndex++}`,
      `$${paramIndex++}`,
      `$${paramIndex++}`
    );

    // Lineage columns
    columnNames.push("load_run_id", "load_ts");
    placeholders.push(`$${paramIndex++}`, `$${paramIndex++}`);

    return `
      INSERT INTO ${this.config.targetTable} (${columnNames.join(", ")})
      VALUES (${placeholders.join(", ")})
      RETURNING *
    `;
  }

  /**
   * Build UPDATE query for updating non-significant attributes
   */
  buildUpdateQuery(): string {
    const setClauses: string[] = [];
    let paramIndex = 1;

    // Update non-significant fields only
    const nonSignificantFields = this.config.nonSignificantFields;

    for (const field of nonSignificantFields) {
      setClauses.push(`${this.toSnakeCase(field)} = $${paramIndex++}`);
    }

    // Update lineage
    setClauses.push(
      `load_run_id = $${paramIndex++}`,
      `load_ts = $${paramIndex++}`
    );

    // WHERE clause uses business key and is_current
    const whereConditions = this.config.businessKeyFields.map(
      (field) => `${this.toSnakeCase(field)} = $${paramIndex++}`
    );
    whereConditions.push(`is_current = true`);

    return `
      UPDATE ${this.config.targetTable}
      SET ${setClauses.join(", ")}
      WHERE ${whereConditions.join(" AND ")}
      RETURNING *
    `;
  }

  /**
   * Build UPDATE query for expiring a version (set effective_to, is_current = false)
   */
  buildExpireQuery(): string {
    const whereConditions = this.config.businessKeyFields.map(
      (field, idx) => `${this.toSnakeCase(field)} = $${idx + 1}`
    );
    whereConditions.push(`is_current = true`);

    const paramCount = this.config.businessKeyFields.length;

    return `
      UPDATE ${this.config.targetTable}
      SET effective_to = $${paramCount + 1}, is_current = false
      WHERE ${whereConditions.join(" AND ")}
      RETURNING *
    `;
  }

  /**
   * Build SELECT query for getting current version by business key
   */
  buildGetCurrentQuery(): string {
    const whereConditions = this.config.businessKeyFields.map(
      (field, idx) => `${this.toSnakeCase(field)} = $${idx + 1}`
    );
    whereConditions.push(`is_current = true`);

    return `
      SELECT *
      FROM ${this.config.targetTable}
      WHERE ${whereConditions.join(" AND ")}
      LIMIT 1
    `;
  }

  /**
   * Convert camelCase to snake_case
   */
  protected toSnakeCase(str: string): string {
    if (typeof str !== "string") {
      console.error("toSnakeCase received non-string:", {
        str,
        type: typeof str,
      });
      throw new Error(
        `Expected string but got ${typeof str}: ${JSON.stringify(str)}`
      );
    }
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }

  /**
   * Get configuration
   */
  getConfig(): DimensionHandlerConfig {
    return this.config;
  }

  /**
   * Get SCD2 configuration
   */
  getSCD2Config(): SCD2Config {
    return this.scd2Config;
  }

  /**
   * Log handler info
   */
  logInfo(message: string, metadata?: Record<string, unknown>): void {
    logger.info(`[${this.getDimensionType()}] ${message}`, metadata);
  }

  /**
   * Log handler error
   */
  logError(
    message: string,
    error?: Error,
    metadata?: Record<string, unknown>
  ): void {
    logger.error(`[${this.getDimensionType()}] ${message}`, {
      ...metadata,
      error: error?.message,
      stack: error?.stack,
    });
  }
}
