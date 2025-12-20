import 'dotenv/config';
import { app } from './app';
import { logger } from './logger';



const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    logger.info({ port: PORT }, 'Local server started 🚀');
  });
}

export default app;