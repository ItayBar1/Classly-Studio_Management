import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/userService';
import { InvitationService } from '../services/invitationService';
import { logger } from '../logger';

export class UserController {

  static async getMe(req: Request, res: Response, next: NextFunction) {
    const requestLog = req.logger || logger.child({ controller: 'UserController', method: 'getMe' });
    requestLog.info({ params: req.params, userId: req.user?.id }, 'Controller entry');

    try {
      // The ID is added by authMiddleware
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

  /**
   * SECURITY: Prepare a registration by validating studio and storing the validated studio_id
   * This prevents clients from self-assigning to arbitrary studios
   */
  static async prepareRegistration(req: Request, res: Response, next: NextFunction) {
    const requestLog = req.logger || logger.child({ controller: 'UserController', method: 'prepareRegistration' });
    const { email, serialNumber, invitationToken } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    requestLog.info({ email, serialNumber, hasToken: !!invitationToken }, 'Preparing registration');

    try {
      let studioId: string;

      // If there's an invitation token, validate it and get studio from there
      if (invitationToken) {
        const invitation = await InvitationService.validateInvitation(invitationToken);
        
        if (!invitation || !invitation.valid) {
          return res.status(400).json({ error: 'Invalid or expired invitation token' });
        }
        
        studioId = invitation.studioId;
      } 
      // Otherwise, validate the studio serial number
      else if (serialNumber) {
        const studio = await UserService.validateStudioSerial(serialNumber);
        
        if (!studio) {
          return res.status(404).json({ error: 'Studio not found' });
        }
        
        studioId = studio.id;
      } else {
        return res.status(400).json({ error: 'Either serialNumber or invitationToken is required' });
      }

      // Create pending registration with validated studio_id
      const pendingReg = await UserService.createPendingRegistration(email, studioId, invitationToken);

      requestLog.info({ email, studioId }, 'Registration prepared successfully');
      res.status(200).json({ 
        success: true, 
        message: 'Registration prepared. You can now sign up.',
        pendingRegistrationId: pendingReg.id 
      });

    } catch (error) {
      requestLog.error({ err: error }, 'Error preparing registration');
      next(error);
    }
  }
}
