/**
 * Validation Engine
 * Validates transformed data against business rules before loading to staging
 */

import type {
  ValidationRule,
  ValidationFailure,
  ColumnTransformation,
} from "./types/transformer";
import { ValidationType } from "./types/transformer";
import type { ValidationConfig } from "./types/config";

/**
 * Result of validating a single row
 */
export interface RowValidationResult {
  isValid: boolean;
  failures: ValidationFailure[];
  warnings: ValidationFailure[];
}

/**
 * Result of validating a batch
 */
export interface BatchValidationResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  rowResults: RowValidationResult[];
}

/**
 * Validation engine for applying business rules to transformed data
 */
export class ValidationEngine {
  constructor(private config: ValidationConfig) {}

  /**
   * Validate a single transformed row
   */
  validateRow(
    row: Record<string, any>,
    transformations: ColumnTransformation[]
  ): RowValidationResult {
    const failures: ValidationFailure[] = [];
    const warnings: ValidationFailure[] = [];

    // Skip validation if disabled
    if (!this.config.enableValidation) {
      return { isValid: true, failures: [], warnings: [] };
    }

    for (const transformation of transformations) {
      const { targetColumn, validationRules } = transformation;

      if (!validationRules || validationRules.length === 0) {
        continue;
      }

      const value = row[targetColumn];

      for (const rule of validationRules) {
        const ruleResult = this.applyValidationRule(rule, value, row);

        if (!ruleResult.passed) {
          const failure: ValidationFailure = {
            columnName: targetColumn,
            rule: rule.name,
            actualValue: value,
            errorMessage: rule.errorMessage,
          };

          if (rule.severity === "error") {
            failures.push(failure);
          } else {
            warnings.push(failure);
          }
        }
      }
    }

    return {
      isValid: failures.length === 0,
      failures,
      warnings,
    };
  }

  /**
   * Validate a batch of rows
   */
  validateBatch(
    rows: Record<string, any>[],
    transformations: ColumnTransformation[]
  ): BatchValidationResult {
    const rowResults = rows.map((row) =>
      this.validateRow(row, transformations)
    );

    const validRows = rowResults.filter((r) => r.isValid).length;
    const invalidRows = rowResults.filter((r) => !r.isValid).length;

    return {
      totalRows: rows.length,
      validRows,
      invalidRows,
      rowResults,
    };
  }

  /**
   * Apply a single validation rule
   */
  private applyValidationRule(
    rule: ValidationRule,
    value: any,
    row: Record<string, any>
  ): { passed: boolean } {
    try {
      const passed = rule.validator(value, row);
      return { passed };
    } catch (error) {
      // If validation throws an error, consider it failed
      console.error(`Validation rule '${rule.name}' threw error:`, error);
      return { passed: false };
    }
  }

  /**
   * Check if we should stop validation based on error thresholds
   */
  shouldStopValidation(
    currentBatchErrors: number,
    totalErrors: number
  ): boolean {
    if (!this.config.enableValidation) {
      return false;
    }

    if (
      this.config.maxErrorsPerBatch > 0 &&
      currentBatchErrors >= this.config.maxErrorsPerBatch
    ) {
      return true;
    }

    if (
      this.config.maxTotalErrors > 0 &&
      totalErrors >= this.config.maxTotalErrors
    ) {
      return true;
    }

    return false;
  }
}

/**
 * Common validation rule builders
 */
export class ValidationRuleBuilders {
  /**
   * Create a required field validation rule
   */
  static required(columnName: string): ValidationRule {
    return {
      name: "required",
      type: ValidationType.REQUIRED,
      validator: (value) =>
        value !== null && value !== undefined && value !== "",
      errorMessage: `${columnName} is required`,
      severity: "error",
    };
  }

  /**
   * Create a regex pattern validation rule
   */
  static pattern(
    columnName: string,
    pattern: RegExp,
    description: string
  ): ValidationRule {
    return {
      name: "pattern",
      type: ValidationType.FORMAT,
      validator: (value) => {
        if (value === null || value === undefined) return true; // Skip null values
        return pattern.test(String(value));
      },
      errorMessage: `${columnName} must match ${description}`,
      severity: "error",
    };
  }

  /**
   * Create a numeric range validation rule
   */
  static range(columnName: string, min: number, max: number): ValidationRule {
    return {
      name: "range",
      type: ValidationType.RANGE,
      validator: (value) => {
        if (value === null || value === undefined) return true;
        const num = Number(value);
        return !isNaN(num) && num >= min && num <= max;
      },
      errorMessage: `${columnName} must be between ${min} and ${max}`,
      severity: "error",
    };
  }

  /**
   * Create an enum validation rule
   */
  static enum(columnName: string, allowedValues: any[]): ValidationRule {
    return {
      name: "enum",
      type: ValidationType.ENUM,
      validator: (value) => {
        if (value === null || value === undefined) return true;
        return allowedValues.includes(value);
      },
      errorMessage: `${columnName} must be one of: ${allowedValues.join(", ")}`,
      severity: "error",
    };
  }

  /**
   * Create a string length validation rule
   */
  static length(
    columnName: string,
    minLength?: number,
    maxLength?: number
  ): ValidationRule {
    return {
      name: "length",
      type: ValidationType.LENGTH,
      validator: (value) => {
        if (value === null || value === undefined) return true;
        const str = String(value);
        if (minLength !== undefined && str.length < minLength) return false;
        if (maxLength !== undefined && str.length > maxLength) return false;
        return true;
      },
      errorMessage: `${columnName} length must be ${minLength !== undefined ? `at least ${minLength}` : ""} ${maxLength !== undefined ? `at most ${maxLength}` : ""}`,
      severity: "error",
    };
  }

  /**
   * Create an NHI format validation rule (New Zealand specific)
   */
  static nhiFormat(columnName: string): ValidationRule {
    // NHI format: 3 letters followed by 4 digits
    const nhiPattern = /^[A-Z]{3}\d{4}$/;
    return {
      name: "nhi_format",
      type: ValidationType.FORMAT,
      validator: (value) => {
        if (value === null || value === undefined) return true;
        return nhiPattern.test(String(value).toUpperCase());
      },
      errorMessage: `${columnName} must be in NHI format (e.g., ABC1234)`,
      severity: "error",
    };
  }

  /**
   * Create an email validation rule
   */
  static email(columnName: string): ValidationRule {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
      name: "email",
      type: ValidationType.FORMAT,
      validator: (value) => {
        if (value === null || value === undefined) return true;
        return emailPattern.test(String(value));
      },
      errorMessage: `${columnName} must be a valid email address`,
      severity: "warning", // Email format might be lenient
    };
  }
}
