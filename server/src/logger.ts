import { randomUUID } from "crypto";
import pino, { LoggerOptions, Logger } from "pino";
import { Request, Response, NextFunction } from "express";
import { environment } from "./config/env";

// בדיקה האם אנחנו רצים ב-Vercel או בפרודקשיין
const isVercel = process.env.VERCEL === "1";
const isProduction =
  environment.nodeEnv === "production" || process.env.NODE_ENV === "production";

// נשתמש ב-Pretty Print רק אם אנחנו בפיתוח מקומי וגם לא ב-Vercel
const usePrettyPrint =
  !isProduction && !isVercel && environment.nodeEnv !== "test";

const loggerOptions: LoggerOptions = {
  level: environment.logLevel || "info",
  base: { service: "classly-server" },
  // אם אנחנו בפרודקשיין או ב-Vercel - נשתמש ב-JSON הרגיל (undefined transport)
  // זה מונע את השגיאה של טעינת ה-worker thread
  transport: usePrettyPrint
    ? {
        target: "pino-pretty",
        options: { colorize: true },
      }
    : undefined,
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
    // המרת BigInt ל-Number בטוחה
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    req.logger?.info(
      { statusCode: res.statusCode, durationMs },
      "Request completed"
    );
  });

  next();
};
