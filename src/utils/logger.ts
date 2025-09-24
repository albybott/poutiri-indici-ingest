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

  debug(message: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message));
    }
  }

  info(message: string): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage(LogLevel.INFO, message));
    }
  }

  warn(message: string): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(LogLevel.WARN, message));
    }
  }

  error(message: string): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage(LogLevel.ERROR, message));
    }
  }
}
