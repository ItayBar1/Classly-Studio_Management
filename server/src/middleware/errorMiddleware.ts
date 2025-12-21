import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';

interface AppError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}

const errorHandler = (err: AppError, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
        return next(err);
    }

    const statusCode = err.statusCode || 500;
    const requestLogger = req.logger || logger;

    requestLogger.error({
        message: err.message,
        stack: err.stack,
        statusCode,
        path: req.path,
        method: req.method,
        requestId: req.requestId,
    });

    const message = err.isOperational ? err.message : 'Something went wrong on the server.';

    res.status(statusCode).json({
        status: 'error',
        message,
    });
};

export default errorHandler;
