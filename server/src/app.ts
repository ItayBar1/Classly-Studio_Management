import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import Routes
import courseRoutes from './routes/courseRoutes';
import studentRoutes from './routes/studentRoutes';
import instructorRoutes from './routes/instructorRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import enrollmentRoutes from './routes/enrollmentRoutes';
import webhookRoutes from './routes/webhookRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import paymentRoutes from './routes/paymentsRoutes';

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

const allowedOrigins = [process.env.CLIENT_URL, 'http://localhost:3000'];

app.use(cors({
    origin: (origin, callback) => {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true
}));

// --- Critical Section for Webhooks ---
// מגדירים את ה-Webhook לפני ה-JSON Parser הגלובלי!
// אנו משתמשים ב-express.raw() ספציפית לנתיב זה כדי לשמור על החתימה המקורית
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

// --- General Middleware ---
app.use(express.json()); // שאר האפליקציה עובדת עם JSON רגיל

// Routes
app.use('/api/courses', courseRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/instructors', instructorRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/payments', paymentRoutes);

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running 🚀' });
});

// Global Error Handler
import errorHandler from './middleware/errorMiddleware';
app.use(errorHandler);

export default app;