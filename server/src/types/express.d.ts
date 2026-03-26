import { Logger } from "pino";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string | null;
        studio_id: string | null;
        status: string | null;
      };
      studioId?: string;
      requestId?: string;
      logger?: Logger;
    }
  }
}

export {};
