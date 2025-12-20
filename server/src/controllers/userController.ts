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


  static async validateStudio(req: Request, res: Response, next: NextFunction) {
    const requestLog = req.logger || logger.child({ controller: 'UserController', method: 'validateStudio' });
    const { serialNumber } = req.params;

    if (!serialNumber) {
      return res.status(400).json({ error: 'Studio serial number is required' });
    }

    requestLog.info({ serialNumber }, 'Validating studio serial request');

    try {
      const studio = await UserService.validateStudioSerial(serialNumber);

      if (!studio) {
        return res.status(404).json({ valid: false, message: 'Studio not found' });
      }

      res.status(200).json({ valid: true, studio });
    } catch (error) {
      requestLog.error({ err: error }, 'Error validating studio');
      next(error);
    }
  }
}