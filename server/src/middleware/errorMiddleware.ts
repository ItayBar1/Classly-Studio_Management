import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';

interface AppError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}

const errorHandler = (err: AppError, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.statusCode || 500;

    // Log the error
    logger.error({
        message: err.message,
        stack: err.stack,
        statusCode: statusCode,
        path: req.path,
        method: req.method,
    });

    // Send a generic message to the client
    // For operational errors, we can send a more specific message
    const message = err.isOperational ? err.message : 'Something went wrong on the server.';

    res.status(statusCode).json({
        status: 'error',
        message,
    });
};

export default errorHandler;
