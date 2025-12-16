import { randomUUID } from 'crypto';
import pino, { LoggerOptions, Logger } from 'pino';
import { Request, Response, NextFunction } from 'express';

const loggerOptions: LoggerOptions = {
  level: process.env.LOG_LEVEL || 'info',
  base: { service: 'classly-server' },
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: { colorize: true }
  } : undefined
};

export const logger: Logger = pino(loggerOptions);

declare module 'express-serve-static-core' {
  interface Request {
    logger?: Logger;
    requestId?: string;
  }
}

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const requestId = (req.headers['x-request-id'] as string) || randomUUID();
  req.requestId = requestId;
  req.logger = logger.child({ requestId, path: req.path, method: req.method });

  req.logger.info({ query: req.query }, 'Incoming request');

  res.on('finish', () => {
    req.logger?.info({ statusCode: res.statusCode }, 'Request completed');
  });

  next();
};
