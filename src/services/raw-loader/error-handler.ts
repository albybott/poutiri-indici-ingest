import type {
  ErrorSummary,
  RecoveryOptions,
  RecoveryResult,
} from "./types/errors";
import { LoadErrorType, type LoadError } from "../../shared/types";
import type { ErrorHandlingConfig } from "./types/config";

/**
 * Error Handler - manages error processing and recovery
 */
export class ErrorHandler {
  private config: ErrorHandlingConfig;

  constructor(config: ErrorHandlingConfig) {
    this.config = config;
  }

  /**
   * Handle an error and convert to LoadError
   */
  async handleError(error: Error | any, context: any): Promise<LoadError> {
    const loadError: LoadError = {
      errorType: this.classifyError(error),
      message: error.message || "Unknown error",
      timestamp: new Date(),
      isRetryable: this.isRetryable(error),
      context,
    };

    // Add specific error details based on type
    if (error.code) {
      loadError.context = { ...loadError.context, errorCode: error.code };
    }

    if (error.rowNumber !== undefined) {
      loadError.rowNumber = error.rowNumber;
    }

    if (error.columnName) {
      loadError.columnName = error.columnName;
    }

    if (error.rawRow) {
      loadError.rawRow = error.rawRow;
    }

    // Log error if configured
    if (this.config.logErrors) {
      await this.logError(loadError);
    }

    return loadError;
  }

  /**
   * Check if error should trigger retry
   */
  async shouldRetry(error: LoadError): Promise<boolean> {
    if (!error.isRetryable) {
      return false;
    }

    // Check if we've exceeded retry limits
    // This would be tracked per operation context
    return true;
  }

  /**
   * Get retry delay for error
   */
  async getRetryDelay(attempt: number): Promise<number> {
    // Exponential backoff with jitter
    const baseDelay = this.config.retryDelayMs;
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.1 * exponentialDelay;

    return Math.min(exponentialDelay + jitter, 30000); // Max 30 seconds
  }

  /**
   * Log error for monitoring
   */
  async logError(error: LoadError): Promise<void> {
    const logLevel = this.determineLogLevel(error);
    const logMessage = this.formatErrorMessage(error);

    console[logLevel](logMessage, {
      errorType: error.errorType,
      message: error.message,
      timestamp: error.timestamp,
      context: error.context,
    });
  }

  /**
   * Get error summary
   */
  async getErrorSummary(errors: LoadError[]): Promise<ErrorSummary> {
    const errorsByType: Record<string, number> = {};
    const errorsByFile: Record<string, number> = {};
    const errorsByRowRange: { start: number; end: number; count: number }[] =
      [];

    for (const error of errors) {
      // Count by type
      errorsByType[error.errorType] = (errorsByType[error.errorType] || 0) + 1;

      // Count by file
      const fileKey = error.fileKey || "unknown";
      errorsByFile[fileKey] = (errorsByFile[fileKey] || 0) + 1;
    }

    return {
      totalErrors: errors.length,
      errorsByType,
      topErrors: errors.slice(0, 10),
      retryableErrors: errors.filter((e) => e.isRetryable).length,
      blockingErrors: errors.filter((e) => !e.isRetryable).length,
      errorsByFile,
      errorsByRowRange,
    };
  }

  // Private helper methods

  private classifyError(error: Error | any): LoadErrorType {
    if (error instanceof Error) {
      const errorCode = (error as any).code;

      // Database errors
      if (errorCode === "23505") return LoadErrorType.CONSTRAINT_VIOLATION;
      if (errorCode === "42P01") return LoadErrorType.DATABASE_ERROR;
      if (errorCode === "08000") return LoadErrorType.DATABASE_ERROR;

      // Parse errors
      if (error.message.includes("CSV") || error.message.includes("parse")) {
        return LoadErrorType.CSV_PARSE_ERROR;
      }

      // Validation errors
      if (
        error.message.includes("validation") ||
        error.message.includes("required")
      ) {
        return LoadErrorType.VALIDATION_ERROR;
      }

      // File errors
      if (error.message.includes("not found") || errorCode === "NoSuchKey") {
        return LoadErrorType.FILE_NOT_FOUND;
      }

      // Permission errors
      if (
        error.message.includes("permission") ||
        errorCode === "AccessDenied"
      ) {
        return LoadErrorType.PERMISSION_ERROR;
      }
    }

    return LoadErrorType.DATABASE_ERROR;
  }

  private isRetryable(error: Error | any): boolean {
    const errorType = this.classifyError(error);
    const errorCode = (error as any).code;

    switch (errorType) {
      case LoadErrorType.DATABASE_ERROR:
        // Network timeouts, connection issues are retryable
        return errorCode === "08000" || errorCode === "08003";
      case LoadErrorType.CSV_PARSE_ERROR:
        return false; // Parse errors are usually not retryable
      case LoadErrorType.VALIDATION_ERROR:
        return false; // Data validation errors are not retryable
      case LoadErrorType.CONSTRAINT_VIOLATION:
        return false; // Constraint violations are not retryable
      case LoadErrorType.FILE_NOT_FOUND:
        return false; // File not found is not retryable
      case LoadErrorType.PERMISSION_ERROR:
        return false; // Permission errors are not retryable
      default:
        return true; // Other errors might be retryable
    }
  }

  private determineLogLevel(error: LoadError): "error" | "warn" | "info" {
    switch (error.errorType) {
      case LoadErrorType.CSV_PARSE_ERROR:
      case LoadErrorType.VALIDATION_ERROR:
      case LoadErrorType.CONSTRAINT_VIOLATION:
        return "error";
      case LoadErrorType.FILE_NOT_FOUND:
      case LoadErrorType.PERMISSION_ERROR:
        return "warn";
      default:
        return "error";
    }
  }

  private formatErrorMessage(error: LoadError): string {
    let message = `[${error.errorType}] ${error.message}`;

    if (error.fileKey) {
      message += ` (File: ${error.fileKey})`;
    }

    if (error.rowNumber) {
      message += ` (Row: ${error.rowNumber})`;
    }

    if (error.columnName) {
      message += ` (Column: ${error.columnName})`;
    }

    return message;
  }
}
