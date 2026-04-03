import { Router, Request, Response } from "express";
import { logger } from "../logger";
import { authenticateUser } from "../middleware/authMiddleware";

const router = Router();

// Receives logs from the client, strictly authenticated
router.post("/", (req: Request, res: Response) => {
  const { level = "info", message, context, ...rest } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Log message is required" });
  }

  // Use the child logger if it exists on the request, otherwise fallback to the central logger
  const logMethod =
    (req.logger || logger)[
      level as "info" | "warn" | "error" | "debug" | "fatal" | "trace"
    ] || (req.logger || logger).info;

  logMethod(
    {
      source: "frontend",
      context,
      ...rest,
    },
    message
  );

  res.status(200).json({ success: true });
});

export default router;
