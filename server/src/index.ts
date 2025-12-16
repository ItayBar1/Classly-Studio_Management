import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import paymentRoutes from './routes/payments';

// טעינת משתני סביבה
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json()); // מאפשר קריאת JSON ב-Body
app.use(cors()); // מאפשר גישה מה-Client (כרגע פתוח לכולם לפיתוח)
app.use(helmet()); // אבטחה בסיסית של Headerים
app.use(morgan('dev')); // לוגים של בקשות בטרמינל

// בדיקת שפיות (Health Check)
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'Classly Server is running 🚀' });
});

// Routes
app.use('/api/payment', paymentRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});