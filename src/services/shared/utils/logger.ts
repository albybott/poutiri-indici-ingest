export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

export interface LoggerOptions {
  level: LogLevel;
  prefix?: string;
}

export class Logger {
  private level: LogLevel;
  private prefix: string;

  constructor(options: LoggerOptions) {
    this.level = options.level;
    this.prefix = options.prefix || "[APP]";
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = Object.values(LogLevel);
    const currentIndex = levels.indexOf(this.level);
    const messageIndex = levels.indexOf(level);
    return messageIndex >= currentIndex;
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `${timestamp} ${level.toUpperCase()} ${this.prefix} ${message}`;
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const metadataStr = metadata ? ` ${JSON.stringify(metadata)}` : "";
      console.debug(this.formatMessage(LogLevel.DEBUG, message) + metadataStr);
    }
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const metadataStr = metadata ? ` ${JSON.stringify(metadata)}` : "";
      console.info(this.formatMessage(LogLevel.INFO, message) + metadataStr);
    }
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const metadataStr = metadata ? ` ${JSON.stringify(metadata)}` : "";
      console.warn(this.formatMessage(LogLevel.WARN, message) + metadataStr);
    }
  }

  error(message: string, metadata?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const metadataStr = metadata ? ` ${JSON.stringify(metadata)}` : "";
      console.error(this.formatMessage(LogLevel.ERROR, message) + metadataStr);
    }
  }
}

// Default logger instance
export const logger = new Logger({
  level: LogLevel.INFO,
  prefix: "[Core-Merger]",
});
