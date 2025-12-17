import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/userService';
import { logger } from '../logger';

export class UserController {

  static async getMe(req: Request, res: Response, next: NextFunction) {
    const requestLog = req.logger || logger.child({ controller: 'UserController', method: 'getMe' });
    requestLog.info({ params: req.params, userId: req.user?.id }, 'Controller entry');

    try {
      // ה-ID מגיע מה-authMiddleware
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User ID not found in request' });
      }

      const userProfile = await UserService.getUserProfile(userId);

      requestLog.info({ userId }, 'Fetched user profile successfully');
      res.status(200).json(userProfile);

    } catch (error: any) {
      requestLog.error({ err: error }, 'Error fetching user profile');
      next(error);
    }
  }
}