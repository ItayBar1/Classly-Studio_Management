import dotenv from 'dotenv';
import { app } from './app';
import { logger } from './logger';

// טעינת משתני סביבה
dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Server started and listening 🚀');
});