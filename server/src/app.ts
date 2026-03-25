import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { allowedCorsOrigins } from "./config/env";

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
import { requestLogger } from "./logger";

export const app = express();

// --- Fix for Vercel / Rate Limit ---
// Vercel acts as a reverse proxy. We must trust the first proxy hop
// so that express-rate-limit can see the real user IP address.
app.set("trust proxy", 1);

// Security Middleware — explicit CSP (SEC2)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // 'unsafe-inline' remains for the dark-mode FOUC prevention script in index.html.
        // That script cannot be moved to a file (it must run before first paint).
        // All other inline scripts and CDN dependencies have been removed in Phase 3.
        scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'", // Required for Google Fonts injected CSS
          "https://fonts.googleapis.com",
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: [
          "'self'",
          "data:", // Inline SVG favicon
          "https://images.unsplash.com",
        ],
        connectSrc: ["'self'", "https://api.stripe.com"],
        frameSrc: [
          "https://js.stripe.com", // Stripe Elements renders inside iframes
        ],
        frameAncestors: ["'none'"], // Equivalent to X-Frame-Options: DENY (modern)
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
  })
);

// Rate Limiting to prevent brute-force attacks
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

      // No Origin header: allowed in dev (curl, Postman, local sims), blocked in prod.
      if (!origin) {
        return isProd
          ? callback(new Error("Origin header required"), false)
          : callback(null, true);
      }

      // In production only the production domain is whitelisted.
      // In development the full allowedCorsOrigins list (localhost variants) is used.
      const allowed: string[] = isProd
        ? ([process.env.CLIENT_URL].filter(Boolean) as string[])
        : allowedCorsOrigins;

      if (!allowed.includes(origin)) {
        return callback(
          new Error(
            "The CORS policy for this site does not allow access from the specified Origin."
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

// Request logging
app.use(requestLogger);

// --- Critical Section for Webhooks ---
// Configure the webhook before the global JSON parser.
// express.raw() is required to preserve the original body for signature validation.
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

// Global Error Handler
import errorHandler from "./middleware/errorMiddleware";
app.use(errorHandler);

export default app;
