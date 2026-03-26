import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import sanitizeHtml from "sanitize-html";
import { ValidationError } from "../utils/AppError";

// Fields that must never be sanitized — they are opaque secrets that are
// only hashed or compared server-side and never rendered back to the client.
const SENSITIVE_FIELDS = new Set([
  "password",
  "token",
  "invitationToken",
  "newPassword",
  "currentPassword",
]);

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [],
  allowedAttributes: {},
};

/**
 * Recursively strips HTML tags from all string fields in a request body
 * object, except for fields listed in SENSITIVE_FIELDS.
 */
function sanitizeBody(obj: unknown, key?: string): unknown {
  // Never touch sensitive fields (passwords, tokens, etc.)
  if (key !== undefined && SENSITIVE_FIELDS.has(key)) {
    return obj;
  }
  if (typeof obj === "string") {
    return sanitizeHtml(obj, SANITIZE_OPTIONS);
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeBody(item));
  }
  if (obj !== null && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [k, value] of Object.entries(obj as Record<string, unknown>)) {
      result[k] = sanitizeBody(value, k);
    }
    return result;
  }
  return obj;
}

/**
 * Express middleware factory that:
 *   1. Strips HTML tags from all string fields in req.body (except sensitive fields).
 *   2. Validates the sanitized body against the provided Zod schema.
 *
 * Sanitization lives here — not in individual service files — so no route
 * can accidentally skip it.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    // Step 1 — strip HTML
    req.body = sanitizeBody(req.body);

    // Step 2 — Zod validation
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const firstError = result.error.errors[0];
      const err = new ValidationError(
        firstError.message,
        firstError.path.join(".")
      );
      return next(err);
    }

    req.body = result.data;
    next();
  };
}
