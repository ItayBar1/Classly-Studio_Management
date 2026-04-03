import { Router, Request, Response } from "express";
import { logger } from "../logger";

const router = Router();

// Receives logs from the client
router.post("/", (req: Request, res: Response) => {
  const { level = "info", message, context, ...rest } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Log message is required" });
  }

  const logInstance = req.logger || logger;
  const validLevels = ["info", "warn", "error", "debug", "fatal", "trace"];

  const safeLevel = validLevels.includes(level)
    ? (level as "info" | "warn" | "error" | "debug" | "fatal" | "trace")
    : "info";

  logInstance[safeLevel](
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
