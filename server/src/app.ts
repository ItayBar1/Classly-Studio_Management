import express from 'express';
import cors from 'cors';
import courseRoutes from './routes/courseRoutes';

const app = express();

// הגדרת CORS - כך שרק הקליינט שלך יוכל לגשת
// ב-Production יש להחליף את הכוכבית בדומיין האמיתי
app.use(cors({
    origin: process.env.CLIENT_URL || '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(express.json());

// Routes
app.use('/api/courses', courseRoutes);

// Health Check
app.get('/api/health', (req, res) => res.send('Server is running'));

export default app;