import type { ExtractHandler, ValidationRule } from "./types/raw-loader";
import type { CSVRow } from "./indici-csv-parser";

/**
 * Schema-driven handler generator
 * Creates handlers dynamically from Drizzle schema definitions
 */
export class SchemaDrivenHandlerGenerator {
  /**
   * Generate a handler from a Drizzle table schema
   */
  static generateHandler(
    extractType: string,
    tableName: string,
    schemaColumns: Record<string, any>,
    customValidationRules: ValidationRule[] = []
  ): ExtractHandler {
    // Extract column names from schema
    const columnNames = Object.keys(schemaColumns);

    // Filter out lineage columns (these are added automatically by the loader)
    const lineageColumns = [
      "s3_bucket",
      "s3_key",
      "s3_version_id",
      "file_hash",
      "date_extracted",
      "extract_type",
      "load_run_id",
      "load_ts",
    ];

    const sourceColumns = columnNames.filter(
      (col) => !lineageColumns.includes(col)
    );

    // Combine source columns with lineage columns
    const allColumns = [...sourceColumns, ...lineageColumns];

    return {
      extractType,
      tableName,
      columnMapping: allColumns,
      validationRules: customValidationRules,

      async validateRow(row: CSVRow): Promise<any> {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Run custom validation rules
        for (const rule of customValidationRules) {
          const value = row[rule.columnName];
          if (rule.ruleType === "required" && (!value || value === "")) {
            errors.push(`${rule.columnName}: ${rule.errorMessage}`);
          } else if (
            rule.ruleType === "format" &&
            value &&
            !rule.validator(value)
          ) {
            errors.push(`${rule.columnName}: ${rule.errorMessage}`);
          }
        }

        return {
          isValid: errors.length === 0,
          errors,
          warnings,
        };
      },

      async transformRow(row: CSVRow): Promise<any> {
        // Base transformation - just return the row as-is
        // Custom transformations can be added per extract type
        return { ...row };
      },
    };
  }

  /**
   * Generate handlers for all raw tables
   */
  static generateAllHandlers(): Map<string, ExtractHandler> {
    const handlers = new Map<string, ExtractHandler>();

    // This would be populated by importing all schema definitions
    // For now, we'll create a placeholder that can be extended

    return handlers;
  }
}

/**
 * Base class for schema-driven handlers
 */
export abstract class BaseSchemaDrivenHandler implements ExtractHandler {
  abstract extractType: string;
  abstract tableName: string;
  abstract columnMapping: string[];
  abstract validationRules: ValidationRule[];

  async validateRow(row: CSVRow): Promise<any> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Run validation rules
    for (const rule of this.validationRules) {
      const value = row[rule.columnName];
      if (rule.ruleType === "required" && (!value || value === "")) {
        errors.push(`${rule.columnName}: ${rule.errorMessage}`);
      } else if (
        rule.ruleType === "format" &&
        value &&
        !rule.validator(value)
      ) {
        errors.push(`${rule.columnName}: ${rule.errorMessage}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  async transformRow(row: CSVRow): Promise<any> {
    return { ...row };
  }

  preProcess?(row: CSVRow): CSVRow {
    return row;
  }

  postProcess?(row: any): any {
    return row;
  }
}
