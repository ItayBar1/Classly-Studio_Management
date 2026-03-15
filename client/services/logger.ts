import { getStoredToken } from '../utils/storage';

type LogLevel = 'info' | 'warn' | 'error';

/**
 * Logger service for consistent log formatting and production filtering.
 * Sanitizes sensitive data (passwords, tokens) before logging.
 */
class Logger {
  /**
   * Internal logging method with timestamping and sensitive data sanitization.
   * @param level Log level (info, warn, error)
   * @param message Log message
   * @param data Optional data object to log
   */
  private log(level: LogLevel, message: string, data?: any) {
    if (import.meta.env.PROD && level === 'info') {
      return; // Skip info logs in production if desired
    }

    const timestamp = new Date().toISOString();
    const payload = data !== undefined 
      ? (typeof data === 'object' && data !== null && !Array.isArray(data) ? { ...data } : { value: data }) 
      : undefined;

    // Sanitize payload
    if (payload) {
        if (payload.password) payload.password = '***';
        if (payload.token) payload.token = '***';
        if (payload.access_token) payload.access_token = '***';
    }

    // Send to backend bridge
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '/api';
      const token = getStoredToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      fetch(`${apiUrl}/logs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          level,
          message,
          context: payload
        })
      }).catch((err) => {
        // Prevent recursive logging
        console.error('Failed to send log to server:', err);
      });
    } catch(err) {
      console.error('Failed to prepare log for server:', err);
    } // End frontend log bridge

    console[level](`[${timestamp}] [${level.toUpperCase()}] ${message}`, payload || '');
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, data?: any) {
    this.log('error', message, data);
  }
}

export const logger = new Logger();
