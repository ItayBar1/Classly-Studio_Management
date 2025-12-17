import dotenv from 'dotenv';
import { app } from './app'; // ייבוא האפליקציה מ-app.ts
import { logger } from './logger';

dotenv.config();
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Server started and listening 🚀');
});