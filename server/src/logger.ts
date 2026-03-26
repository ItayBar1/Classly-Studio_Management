import { randomUUID } from "crypto";
import pino, { stdTimeFunctions, LoggerOptions, Logger } from "pino";
import { Request, Response, NextFunction } from "express";
import { environment } from "./config/env";

// Check if running in a Vercel environment or production
const isVercel = process.env.VERCEL === "1";
const isProduction =
  environment.nodeEnv === "production" || process.env.NODE_ENV === "production";

// Use pino-pretty for structured console output only in local development (excluding Vercel)
const usePrettyPrint =
  !isProduction && !isVercel && environment.nodeEnv !== "test";

const targets: any[] = [];

if (usePrettyPrint) {
  targets.push({
    target: "pino-pretty",
    options: { colorize: true },
  });
} else {
  // Explicitly add console output for production so we don't lose stdout
  targets.push({
    target: "pino/file",
    options: { destination: 1 }, // 1 = stdout
  });
}

// Add Loki transport
targets.push({
  target: "pino-loki",
  options: {
    batching: true,
    interval: 5,
    host: environment.lokiUrl,
    labels: { application: "classly-backend" },
    propsToLabels: ["service"],
  },
});

const loggerOptions: LoggerOptions = {
  level: environment.logLevel || "info",
  base: { service: "classly-server" },
  transport: {
    targets,
  },
};

export const logger: Logger = pino(loggerOptions);

declare module "express-serve-static-core" {
  interface Request {
    logger?: Logger;
    requestId?: string;
  }
}

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const requestId = (req.headers["x-request-id"] as string) || randomUUID();
  const start = process.hrtime.bigint();
  req.requestId = requestId;
  req.logger = logger.child({ requestId, path: req.path, method: req.method });

  req.logger.info({ query: req.query }, "Incoming request");

  res.on("finish", () => {
    // Safely convert BigInt to Number for duration logging
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    req.logger?.info(
      { statusCode: res.statusCode, durationMs },
      "Request completed"
    );
  });

  next();
};
