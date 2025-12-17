import { Request } from 'express';

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT' | 'PARENT';
      studio_id: string;
    }

    interface Request {
      user?: User;
    }
  }
}