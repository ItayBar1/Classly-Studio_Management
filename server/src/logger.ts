import { randomUUID } from 'crypto';
import pino, { LoggerOptions, Logger } from 'pino';
import { Request, Response, NextFunction } from 'express';
import { environment } from './config/env';

const loggerOptions: LoggerOptions = {
  level: environment.logLevel || 'info',
  base: { service: 'classly-server' },
  transport: environment.nodeEnv !== 'production' ? {
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
  const start = process.hrtime.bigint();
  req.requestId = requestId;
  req.logger = logger.child({ requestId, path: req.path, method: req.method });

  req.logger.info({ query: req.query }, 'Incoming request');

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    req.logger?.info({ statusCode: res.statusCode, durationMs }, 'Request completed');
  });

  next();
};
