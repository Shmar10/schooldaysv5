/**
 * Simple structured logger
 * 
 * Provides structured logging with different log levels.
 * In production, consider upgrading to winston or pino for more advanced features.
 */

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  requestId?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, unknown>;
}

class Logger {
  private shouldLog(level: LogLevel): boolean {
    const envLevel = process.env.LOG_LEVEL?.toLowerCase() || 'info';
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    const envIndex = levels.indexOf(envLevel as LogLevel);
    const levelIndex = levels.indexOf(level);
    
    // If LOG_LEVEL not set or invalid, default to info
    if (envIndex === -1) {
      return levelIndex <= levels.indexOf(LogLevel.INFO);
    }
    
    return levelIndex <= envIndex;
  }

  private formatLog(entry: LogEntry): string {
    const { level, message, timestamp, requestId, error, metadata } = entry;
    
    let output = `[${timestamp}] [${level.toUpperCase()}]`;
    
    if (requestId) {
      output += ` [${requestId}]`;
    }
    
    output += ` ${message}`;
    
    if (error) {
      output += `\n  Error: ${error.name}: ${error.message}`;
      if (error.stack && this.shouldLog(LogLevel.DEBUG)) {
        output += `\n  Stack: ${error.stack}`;
      }
    }
    
    if (metadata && Object.keys(metadata).length > 0) {
      output += `\n  Metadata: ${JSON.stringify(metadata, null, 2)}`;
    }
    
    return output;
  }

  private log(level: LogLevel, message: string, error?: Error, metadata?: Record<string, unknown>, requestId?: string): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      requestId,
      metadata,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    const formatted = this.formatLog(entry);
    
    // Use appropriate console method based on level
    switch (level) {
      case LogLevel.ERROR:
        console.error(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.INFO:
        console.info(formatted);
        break;
      case LogLevel.DEBUG:
        console.debug(formatted);
        break;
    }
  }

  error(message: string, error?: Error, metadata?: Record<string, unknown>, requestId?: string): void {
    this.log(LogLevel.ERROR, message, error, metadata, requestId);
  }

  warn(message: string, metadata?: Record<string, unknown>, requestId?: string): void {
    this.log(LogLevel.WARN, message, undefined, metadata, requestId);
  }

  info(message: string, metadata?: Record<string, unknown>, requestId?: string): void {
    this.log(LogLevel.INFO, message, undefined, metadata, requestId);
  }

  debug(message: string, metadata?: Record<string, unknown>, requestId?: string): void {
    this.log(LogLevel.DEBUG, message, undefined, metadata, requestId);
  }
}

export const logger = new Logger();

