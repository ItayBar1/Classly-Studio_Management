import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { allowedCorsOrigins } from "./config/env";
import { requestLogger } from "./logger";
import errorHandler from "./middleware/errorMiddleware";
import { AppError } from "./utils/AppError";

// Import Routes
import authRoutes from "./routes/authRoutes";
import courseRoutes from "./routes/courseRoutes";
import studentRoutes from "./routes/studentRoutes";
import instructorRoutes from "./routes/instructorRoutes";
import attendanceRoutes from "./routes/attendanceRoutes";
import enrollmentRoutes from "./routes/enrollmentRoutes";
import webhookRoutes from "./routes/webhookRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import paymentRoutes from "./routes/paymentsRoutes";
import userRoutes from "./routes/userRoutes";
import studioRoutes from "./routes/studioRoutes";
import branchRoutes from "./routes/branchRoutes";
import roomRoutes from "./routes/roomRoutes";
import logRoutes from "./routes/logRoutes";

export const app = express();

app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://images.unsplash.com"],
        connectSrc: ["'self'", "https://api.stripe.com"],
        frameSrc: ["https://js.stripe.com"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Explicitly validate trust proxy setting (optional but good for debugging)
  validate: { xForwardedForHeader: false },
});
app.use(limiter);

// Parse cookies (required for HttpOnly JWT cookie auth)
app.use(cookieParser());

app.use(
  cors({
    origin: (origin, callback) => {
      const isProd = process.env.NODE_ENV === "production";

      // No Origin header: always allowed (non-browser callers like Stripe webhooks,
      // health probes, curl). CORS is a browser mechanism — blocking no-Origin
      // provides zero security value and breaks webhook processing.
      if (!origin) {
        return callback(null, true);
      }

      // מנקה את משתנה הסביבה מרווחים ותווים נסתרים, ומסיר סלאש אחרון אם יש
      const clientUrl = (process.env.CLIENT_URL || "")
        .trim()
        .replace(/\/$/, "");
      const wwwClientUrl = clientUrl.replace("https://", "https://www.");

      const reqOrigin = origin.trim().replace(/\/$/, "");

      const allowed: string[] = isProd
        ? [clientUrl, wwwClientUrl].filter(Boolean)
        : allowedCorsOrigins.map((o) => o.trim().replace(/\/$/, ""));

      if (isProd && !clientUrl) {
        return callback(
          new AppError("CLIENT_URL env var is not set", 500),
          false
        );
      }

      if (!allowed.includes(reqOrigin)) {
        return callback(
          new AppError(
            `The CORS policy for this site does not allow access from the specified Origin: ${reqOrigin}`,
            403
          ),
          false
        );
      }
      return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);

app.use(requestLogger);

app.use(
  "/api/webhooks",
  express.raw({ type: "application/json" }),
  webhookRoutes
);

// --- General Middleware ---
app.use(express.json()); // The rest of the app uses standard JSON parsing.

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/instructors", instructorRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/studios", studioRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/logs", logRoutes);

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running 🚀" });
});

app.use(errorHandler);
