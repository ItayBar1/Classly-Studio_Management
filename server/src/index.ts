import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import paymentRoutes from './routes/payments';
import { logger, requestLogger } from './logger';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json()); // Allow reading JSON payloads
app.use(cors()); // Allow access from the client (open for development)
app.use(helmet()); // Basic security headers
app.use(requestLogger);

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  req.logger?.info('Health check requested');
  res.json({ status: 'OK', message: 'Classly Server is running 🚀' });
  req.logger?.info('Health check response sent');
});

// Routes
app.use('/api/payment', paymentRoutes);

app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Server started and listening');
});