/**
 * Transformation Engine
 * Handles type conversion and data transformation from raw text to typed values
 */

import type {
  ColumnTransformation,
  ValidationFailure,
} from "./types/transformer";
import { ColumnType } from "./types/transformer";
import type { TransformationConfig } from "./types/config";

/**
 * Result of a single row transformation
 */
export interface RowTransformResult {
  success: boolean;
  transformedRow?: Record<string, any>;
  validationFailures: ValidationFailure[];
  errors: string[];
}

/**
 * Transformation engine for converting raw text data to typed staging data
 */
export class TransformationEngine {
  constructor(private config: TransformationConfig) {}

  /**
   * Transform a single row from raw to staging format
   */
  async transformRow(
    rawRow: Record<string, any>,
    transformations: ColumnTransformation[]
  ): Promise<RowTransformResult> {
    const transformedRow: Record<string, any> = {};
    const validationFailures: ValidationFailure[] = [];
    const errors: string[] = [];

    for (const transformation of transformations) {
      try {
        const {
          sourceColumn,
          targetColumn,
          targetType,
          required,
          defaultValue,
          transformFunction,
        } = transformation;

        // Get raw value
        let rawValue = rawRow[sourceColumn];

        // Apply preprocessing
        rawValue = this.preprocessValue(rawValue);

        // Apply custom transformation if provided
        if (transformFunction) {
          rawValue = await transformFunction(rawValue, rawRow);
        }

        // Handle NULL/empty values
        if (rawValue === null || rawValue === undefined || rawValue === "") {
          if (required && defaultValue === undefined) {
            validationFailures.push({
              columnName: sourceColumn,
              rule: "required",
              actualValue: rawValue,
              errorMessage: `Required column '${sourceColumn}' is null or empty`,
            });
            continue;
          }
          transformedRow[targetColumn] = defaultValue ?? null;
          continue;
        }

        // Transform based on target type
        const transformedValue = this.transformValue(
          rawValue,
          targetType,
          sourceColumn
        );

        if (transformedValue.success) {
          transformedRow[targetColumn] = transformedValue.value;
        } else {
          validationFailures.push({
            columnName: sourceColumn,
            rule: "type_conversion",
            actualValue: rawValue,
            expectedType: targetType,
            errorMessage: transformedValue.error || "Type conversion failed",
          });
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        errors.push(
          `Error transforming column '${transformation.sourceColumn}': ${errorMessage}`
        );
      }
    }

    return {
      success: validationFailures.length === 0 && errors.length === 0,
      transformedRow:
        validationFailures.length === 0 ? transformedRow : undefined,
      validationFailures,
      errors,
    };
  }

  /**
   * Transform multiple rows in batch
   */
  async transformBatch(
    rawRows: Record<string, any>[],
    transformations: ColumnTransformation[]
  ): Promise<RowTransformResult[]> {
    return Promise.all(
      rawRows.map((row) => this.transformRow(row, transformations))
    );
  }

  /**
   * Preprocess a value (trim, nullify empty strings, etc.)
   */
  private preprocessValue(value: any): any {
    if (typeof value === "string") {
      if (this.config.trimStrings) {
        value = value.trim();
      }
      if (this.config.nullifyEmptyStrings && value === "") {
        return null;
      }
    }
    return value;
  }

  /**
   * Transform a value to the target type
   */
  private transformValue(
    value: any,
    targetType: ColumnType,
    columnName: string
  ): { success: boolean; value?: any; error?: string } {
    try {
      switch (targetType) {
        case ColumnType.TEXT:
          return { success: true, value: String(value) };

        case ColumnType.INTEGER:
          return this.transformToInteger(value);

        case ColumnType.DECIMAL:
          return this.transformToDecimal(value);

        case ColumnType.BOOLEAN:
          return this.transformToBoolean(value);

        case ColumnType.DATE:
          return this.transformToDate(value);

        case ColumnType.TIMESTAMP:
          return this.transformToTimestamp(value);

        case ColumnType.UUID:
          return this.transformToUuid(value);

        case ColumnType.JSON:
          return this.transformToJson(value);

        default:
          return {
            success: false,
            error: `Unsupported target type: ${targetType}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Transform to integer
   */
  private transformToInteger(value: any): {
    success: boolean;
    value?: number;
    error?: string;
  } {
    if (typeof value === "number") {
      return { success: true, value: Math.floor(value) };
    }

    const stringValue = String(value).trim();
    const parsed = parseInt(stringValue, 10);

    if (isNaN(parsed)) {
      return { success: false, error: `Cannot convert '${value}' to integer` };
    }

    return { success: true, value: parsed };
  }

  /**
   * Transform to decimal
   */
  private transformToDecimal(value: any): {
    success: boolean;
    value?: number;
    error?: string;
  } {
    if (typeof value === "number") {
      return { success: true, value };
    }

    const stringValue = String(value).trim();
    const parsed = parseFloat(stringValue);

    if (isNaN(parsed)) {
      return { success: false, error: `Cannot convert '${value}' to decimal` };
    }

    return { success: true, value: parsed };
  }

  /**
   * Transform to boolean
   */
  private transformToBoolean(value: any): {
    success: boolean;
    value?: boolean;
    error?: string;
  } {
    if (typeof value === "boolean") {
      return { success: true, value };
    }

    const stringValue = String(value).toLowerCase().trim();

    // Common boolean representations
    const trueValues = ["true", "1", "yes", "y", "t", "on"];
    const falseValues = ["false", "0", "no", "n", "f", "off"];

    if (trueValues.includes(stringValue)) {
      return { success: true, value: true };
    }

    if (falseValues.includes(stringValue)) {
      return { success: true, value: false };
    }

    return {
      success: false,
      error: `Cannot convert '${value}' to boolean`,
    };
  }

  /**
   * Transform to date
   */
  private transformToDate(value: any): {
    success: boolean;
    value?: Date;
    error?: string;
  } {
    if (value instanceof Date) {
      return { success: true, value };
    }

    const stringValue = String(value).trim();
    const parsed = new Date(stringValue);

    if (isNaN(parsed.getTime())) {
      return { success: false, error: `Cannot convert '${value}' to date` };
    }

    return { success: true, value: parsed };
  }

  /**
   * Transform to timestamp
   */
  private transformToTimestamp(value: any): {
    success: boolean;
    value?: Date;
    error?: string;
  } {
    // Same as date for now, could add timezone handling
    return this.transformToDate(value);
  }

  /**
   * Transform to UUID
   */
  private transformToUuid(value: any): {
    success: boolean;
    value?: string;
    error?: string;
  } {
    const stringValue = String(value).trim();

    // Basic UUID validation
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(stringValue)) {
      return { success: false, error: `Invalid UUID format: ${value}` };
    }

    return { success: true, value: stringValue };
  }

  /**
   * Transform to JSON
   */
  private transformToJson(value: any): {
    success: boolean;
    value?: any;
    error?: string;
  } {
    if (typeof value === "object") {
      return { success: true, value };
    }

    try {
      const parsed = JSON.parse(String(value));
      return { success: true, value: parsed };
    } catch (error) {
      return {
        success: false,
        error: `Cannot parse '${value}' as JSON: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}
