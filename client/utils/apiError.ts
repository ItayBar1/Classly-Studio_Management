/**
 * Pull a human-readable message out of an Axios error.
 *
 * The API answers with `{ error }` from controllers and `{ status, message }`
 * from errorMiddleware, so both shapes have to be handled — reading only
 * `data.error` silently swallowed every error the middleware produced.
 */
export const extractApiError = (err: any, fallback: string): string => {
  const data = err?.response?.data;
  if (typeof data === "string" && data.trim()) return data;

  const message = data?.error || data?.message;
  if (typeof message === "string" && message.trim()) return message;

  return fallback;
};
