import { app } from './app';
import { environment } from './config/env';
import { logger } from './logger';



const PORT = environment.port;

logger.info(
  {
    nodeEnv: environment.nodeEnv,
    vercel: environment.vercel,
    clientUrl: environment.clientUrl,
  },
  'Server configuration loaded'
);

if (environment.nodeEnv !== 'production' && !environment.vercel) {
  app.listen(PORT, () => {
    logger.info({ port: PORT }, 'Local server started 🚀');
  });
}

export default app;
