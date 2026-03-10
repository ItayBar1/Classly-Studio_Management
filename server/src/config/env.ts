import dotenv from 'dotenv';

dotenv.config();

const parseNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
const missing = requiredEnvVars.filter((key) => !process.env[key]);

if (missing.length > 0 && process.env.NODE_ENV !== 'test') {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

export const environment = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseNumber(process.env.PORT, 5000),
  vercel: Boolean(process.env.VERCEL),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  frontendUrl:
    process.env.FRONTEND_URL ||
    process.env.CLIENT_URL ||
    'http://localhost:3000',
  logLevel: process.env.LOG_LEVEL || 'info',
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseNumber(process.env.SMTP_PORT, 587),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || '',
  },
};

export const allowedCorsOrigins = Array.from(
  new Set(
    [process.env.CLIENT_URL, 'http://localhost:3000'].filter(
      (origin): origin is string => Boolean(origin)
    )
  )
);
