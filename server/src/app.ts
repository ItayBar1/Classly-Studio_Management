import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { allowedCorsOrigins } from './config/env';

// Import Routes
import courseRoutes from './routes/courseRoutes';
import studentRoutes from './routes/studentRoutes';
import instructorRoutes from './routes/instructorRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import enrollmentRoutes from './routes/enrollmentRoutes';
import webhookRoutes from './routes/webhookRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import paymentRoutes from './routes/paymentsRoutes';
import userRoutes from './routes/userRoutes';
import studioRoutes from './routes/studioRoutes';
import branchRoutes from './routes/branchRoutes';
import roomRoutes from './routes/roomRoutes';
import { requestLogger } from './logger';

export const app = express();

// Security Middleware
app.use(helmet());

// Rate Limiting to prevent brute-force attacks
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

app.use(cors({
    origin: (origin, callback) => {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedCorsOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true
}));

// Request logging
app.use(requestLogger);

// --- Critical Section for Webhooks ---
// Configure the webhook before the global JSON parser.
// express.raw() is required to preserve the original body for signature validation.
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

// --- General Middleware ---
app.use(express.json()); // The rest of the app uses standard JSON parsing.

// Routes
app.use('/api/courses', courseRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/instructors', instructorRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/studios', studioRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/rooms', roomRoutes);

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running 🚀' });
});

// Global Error Handler
import errorHandler from './middleware/errorMiddleware';
app.use(errorHandler);

export default app;
