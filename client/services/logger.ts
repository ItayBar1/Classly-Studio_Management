// client/services/logger.ts

type LogLevel = 'info' | 'warn' | 'error';

class Logger {
  private log(level: LogLevel, message: string, data?: any) {
    if (import.meta.env.PROD && level === 'info') {
      return; // Skip info logs in production if desired
    }

    const timestamp = new Date().toISOString();
    const payload = data ? { ...data } : undefined;

    // Sanitize payload
    if (payload) {
        if (payload.password) payload.password = '***';
        if (payload.token) payload.token = '***';
        if (payload.access_token) payload.access_token = '***';
    }

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
