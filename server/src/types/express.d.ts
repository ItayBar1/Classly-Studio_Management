import { Logger } from 'pino';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        full_name: string | null;
        role: string | null;
        studio_id: string | null;
        status: string | null;
        phone_number: string | null;
        profile_image_url: string | null;
        [key: string]: unknown;
      };
      studioId?: string;
      requestId?: string;
      logger?: Logger;
    }
  }
}

export {};