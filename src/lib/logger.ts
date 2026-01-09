/**
 * Structured logger for the application
 * Provides consistent logging format across the app
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogMetadata {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, meta?: LogMetadata) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(meta && { meta }),
    };

    // Format output
    const formattedMessage = `[${level.toUpperCase()}] ${timestamp} - ${message}`;
    const metaString = meta ? `\n${JSON.stringify(meta, null, 2)}` : '';

    // Output based on level
    switch (level) {
      case 'error':
        console.error(formattedMessage, metaString);
        // NOTE: Para integrar con servicios externos (Sentry, LogRocket),
        // descomentar y configurar en producción
        break;
      case 'warn':
        console.warn(formattedMessage, metaString);
        break;
      case 'debug':
        if (this.isDevelopment) {
          console.log(formattedMessage, metaString);
        }
        break;
      default:
        console.log(formattedMessage, metaString);
    }
  }

  /**
   * Log informational message
   * 
   * @example
   * logger.info('User logged in', { userId: '123' });
   */
  info(message: string, meta?: LogMetadata) {
    this.log('info', message, meta);
  }

  /**
   * Log warning message
   * 
   * @example
   * logger.warn('Slow query detected', { duration: '2000ms' });
   */
  warn(message: string, meta?: LogMetadata) {
    this.log('warn', message, meta);
  }

  /**
   * Log error message
   * 
   * @example
   * logger.error('Failed to process payment', { error: err.message });
   */
  error(message: string, meta?: LogMetadata) {
    this.log('error', message, meta);
  }

  /**
   * Log debug message (only in development)
   * 
   * @example
   * logger.debug('Processing loan', { loanId: '456' });
   */
  debug(message: string, meta?: LogMetadata) {
    this.log('debug', message, meta);
  }
}

export const logger = new Logger();
