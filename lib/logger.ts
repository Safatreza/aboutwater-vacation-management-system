// aboutwater Vacation Management System - Production Logger

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn', 
  INFO = 'info',
  DEBUG = 'debug'
}

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  requestId?: string
  userId?: string
  error?: Error
  metadata?: Record<string, any>
}

class Logger {
  private logLevel: LogLevel

  constructor() {
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG]
    const currentLevelIndex = levels.indexOf(this.logLevel)
    const messageLevelIndex = levels.indexOf(level)
    return messageLevelIndex <= currentLevelIndex
  }

  private formatLog(entry: LogEntry): string {
    const base = `[${entry.timestamp}] [${entry.level.toUpperCase()}]${entry.requestId ? ` [${entry.requestId}]` : ''} ${entry.message}`
    
    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      return `${base} ${JSON.stringify(entry.metadata)}`
    }
    
    if (entry.error) {
      return `${base}\n${entry.error.stack}`
    }
    
    return base
  }

  private log(level: LogLevel, message: string, options?: {
    requestId?: string
    userId?: string
    error?: Error
    metadata?: Record<string, any>
  }): void {
    if (!this.shouldLog(level)) return

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...options
    }

    const formattedLog = this.formatLog(entry)

    // Console output
    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedLog)
        break
      case LogLevel.WARN:
        console.warn(formattedLog)
        break
      case LogLevel.INFO:
        console.info(formattedLog)
        break
      case LogLevel.DEBUG:
        console.debug(formattedLog)
        break
    }

    // In production, you could also send to external logging service
    // like DataDog, LogRocket, or Sentry
    if (level === LogLevel.ERROR && process.env.NODE_ENV === 'production') {
      this.sendToExternalLogging(entry)
    }
  }

  private async sendToExternalLogging(entry: LogEntry): Promise<void> {
    // Placeholder for external logging service integration
    // Example: Sentry, DataDog, LogRocket, etc.
    try {
      // await sentry.captureException(entry.error, {
      //   tags: { requestId: entry.requestId },
      //   extra: entry.metadata
      // })
    } catch (error) {
      console.error('Failed to send log to external service:', error)
    }
  }

  error(message: string, options?: {
    requestId?: string
    userId?: string
    error?: Error
    metadata?: Record<string, any>
  }): void {
    this.log(LogLevel.ERROR, message, options)
  }

  warn(message: string, options?: {
    requestId?: string
    userId?: string
    metadata?: Record<string, any>
  }): void {
    this.log(LogLevel.WARN, message, options)
  }

  info(message: string, options?: {
    requestId?: string
    userId?: string
    metadata?: Record<string, any>
  }): void {
    this.log(LogLevel.INFO, message, options)
  }

  debug(message: string, options?: {
    requestId?: string
    userId?: string
    metadata?: Record<string, any>
  }): void {
    this.log(LogLevel.DEBUG, message, options)
  }
}

// Export singleton instance
export const logger = new Logger()

// Request ID middleware helper
export function generateRequestId(): string {
  return crypto.randomUUID()
}

// Performance monitoring
export class PerformanceMonitor {
  private startTime: number
  private requestId: string

  constructor(requestId: string, operation: string) {
    this.requestId = requestId
    this.startTime = Date.now()
    logger.debug(`Started ${operation}`, { requestId })
  }

  end(operation: string, metadata?: Record<string, any>): void {
    const duration = Date.now() - this.startTime
    logger.info(`Completed ${operation} in ${duration}ms`, {
      requestId: this.requestId,
      metadata: { ...metadata, duration }
    })
  }

  endWithError(operation: string, error: Error): void {
    const duration = Date.now() - this.startTime
    logger.error(`Failed ${operation} after ${duration}ms`, {
      requestId: this.requestId,
      error,
      metadata: { duration }
    })
  }
}