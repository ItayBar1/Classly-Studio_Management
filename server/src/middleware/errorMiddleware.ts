import { Request, Response, NextFunction } from "express";
import { logger } from "../logger";
import { AppError, ValidationError } from "../utils/AppError";

const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (res.headersSent) {
    return next(err);
  }

  const appErr = err as AppError;
  const statusCode = appErr.statusCode || 500;
  const requestLogger = req.logger || logger;

  requestLogger.error({
    message: err.message,
    stack: err.stack,
    statusCode,
    path: req.path,
    method: req.method,
    requestId: req.requestId,
  });

  const message = appErr.isOperational
    ? err.message
    : "Something went wrong on the server.";

  if (err instanceof ValidationError) {
    return res.status(statusCode).json({
      status: "error",
      message,
      field: err.field,
    });
  }

  res.status(statusCode).json({
    status: "error",
    message,
  });
};

export default errorHandler;
