/**
 * Error Tracking and Monitoring System
 * Provides centralized error handling, logging, and reporting
 */

export interface ErrorLog {
  id: string
  timestamp: Date
  level: 'error' | 'warning' | 'info'
  message: string
  stack?: string
  context?: Record<string, unknown>
  userId?: string
  url?: string
  userAgent?: string
}

class ErrorTracker {
  private errors: ErrorLog[] = []
  private maxErrors = 1000
  private listeners: ((error: ErrorLog) => void)[] = []

  constructor() {
    if (typeof window !== 'undefined') {
      // Capture unhandled errors
      window.addEventListener('error', (event) => {
        this.captureError(event.error || new Error(event.message), {
          type: 'unhandled_error',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        })
      })

      // Capture unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        this.captureError(
          new Error(`Unhandled Promise Rejection: ${event.reason}`),
          {
            type: 'unhandled_rejection',
            reason: event.reason,
          }
        )
      })
    }
  }

  /**
   * Capture an error
   */
  captureError(error: Error | string, context?: Record<string, unknown>) {
    const errorLog: ErrorLog = {
      id: this.generateId(),
      timestamp: new Date(),
      level: 'error',
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      context,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    }

    this.addError(errorLog)
    this.notifyListeners(errorLog)

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorTracker]', error, context)
    }
  }

  /**
   * Capture a warning
   */
  captureWarning(message: string, context?: Record<string, unknown>) {
    const errorLog: ErrorLog = {
      id: this.generateId(),
      timestamp: new Date(),
      level: 'warning',
      message,
      context,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    }

    this.addError(errorLog)
    this.notifyListeners(errorLog)
  }

  /**
   * Capture an info message
   */
  captureInfo(message: string, context?: Record<string, unknown>) {
    const errorLog: ErrorLog = {
      id: this.generateId(),
      timestamp: new Date(),
      level: 'info',
      message,
      context,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    }

    this.addError(errorLog)
  }

  /**
   * Get all errors
   */
  getErrors(filters?: { level?: ErrorLog['level']; limit?: number }) {
    let filtered = this.errors

    if (filters?.level) {
      filtered = filtered.filter((e) => e.level === filters.level)
    }

    if (filters?.limit) {
      filtered = filtered.slice(-filters.limit)
    }

    return filtered
  }

  /**
   * Clear all errors
   */
  clearErrors() {
    this.errors = []
  }

  /**
   * Subscribe to error events
   */
  subscribe(callback: (error: ErrorLog) => void) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback)
    }
  }

  /**
   * Export errors as JSON
   */
  exportErrors() {
    return JSON.stringify(this.errors, null, 2)
  }

  private addError(error: ErrorLog) {
    this.errors.push(error)

    // Keep only last N errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors)
    }
  }

  private notifyListeners(error: ErrorLog) {
    this.listeners.forEach((listener) => {
      try {
        listener(error)
      } catch (e) {
        console.error('Error in error listener:', e)
      }
    })
  }

  private generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

// Singleton instance
export const errorTracker = new ErrorTracker()

/**
 * Error boundary helper
 */
export function withErrorTracking<T extends (...args: unknown[]) => unknown>(
  fn: T,
  context?: Record<string, unknown>
): T {
  return ((...args: unknown[]) => {
    try {
      const result = fn(...args)
      if (result instanceof Promise) {
        return result.catch((error) => {
          errorTracker.captureError(error, context)
          throw error
        })
      }
      return result
    } catch (error) {
      errorTracker.captureError(error as Error, context)
      throw error
    }
  }) as T
}
