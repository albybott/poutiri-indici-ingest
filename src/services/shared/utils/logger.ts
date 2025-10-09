export const LogLevels = {
  DEBUG: "debug",
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
};

export type LogLevel = (typeof LogLevels)[keyof typeof LogLevels];

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
    const levels = Object.values(LogLevels);
    const currentIndex = levels.indexOf(this.level);
    const messageIndex = levels.indexOf(level);
    return messageIndex >= currentIndex;
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `${timestamp} ${level.toUpperCase()} ${this.prefix} ${message}`;
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevels.DEBUG)) {
      const metadataStr = metadata ? ` ${JSON.stringify(metadata)}` : "";
      console.debug(this.formatMessage(LogLevels.DEBUG, message) + metadataStr);
    }
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevels.INFO)) {
      const metadataStr = metadata ? ` ${JSON.stringify(metadata)}` : "";
      console.info(this.formatMessage(LogLevels.INFO, message) + metadataStr);
    }
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevels.WARN)) {
      const metadataStr = metadata ? ` ${JSON.stringify(metadata)}` : "";
      console.warn(this.formatMessage(LogLevels.WARN, message) + metadataStr);
    }
  }

  error(message: string, metadata?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevels.ERROR)) {
      const metadataStr = metadata ? ` ${JSON.stringify(metadata)}` : "";
      console.error(this.formatMessage(LogLevels.ERROR, message) + metadataStr);
    }
  }
}

// Default logger instance
export const logger = new Logger({
  level: LogLevels.INFO,
  prefix: "[Core-Merger]",
});
