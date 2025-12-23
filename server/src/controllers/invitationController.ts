import { Request, Response, NextFunction } from 'express';
import { InvitationService } from '../services/invitationService';
import { logger } from '../logger';
import { environment } from '../config/env';

export class InvitationController {

    static async createInvite(req: Request, res: Response, next: NextFunction) {
        const requestLog = req.logger || logger.child({ controller: 'InvitationController', method: 'createInvite' });
        try {
            const { role } = req.body;
            const creatorId = req.user?.id;
            // FIX: Read directly from the public user table object attached to req.user
            const userRole = req.user?.role;
            let studioId = req.user?.studio_id;

            logger.info({ creatorId, userRole, studioId }, 'Creating invite request received');

            if (!creatorId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
                return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
            }

            // If Super Admin, they might be creating an invite for a NEW studio (studioId null) or existing one.
            // Current logic assumes if they are ADMIN, they invite to their OWN studio.
            // If SUPER_ADMIN, studioId stays null (for creating new studio manager) unless passed in body (not implemented yet).

            const invitation = await InvitationService.createInvitation(creatorId, role, studioId);

            res.status(201).json({
                message: 'Invitation created successfully',
                invitation,
                link: `${environment.frontendUrl}/?token=${invitation.token}`
            });

        } catch (error) {
            requestLog.error({ err: error }, 'Error creating invitation');
            next(error);
        }
    }

    static async validateInvite(req: Request, res: Response, next: NextFunction) {
        const requestLog = req.logger || logger.child({ controller: 'InvitationController', method: 'validateInvite' });
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({ valid: false, message: 'Token is required' });
        }

        try {
            const invitation = await InvitationService.validateInvitation(token);

            if (!invitation) {
                return res.status(404).json({ valid: false, message: 'Invalid or expired token' });
            }

            res.status(200).json({ ...invitation });

        } catch (error) {
            requestLog.error({ err: error }, 'Error validating invitation');
            next(error);
        }
    }

    static async acceptInvite(req: Request, res: Response, next: NextFunction) {
        const requestLog = req.logger || logger.child({ controller: 'InvitationController', method: 'acceptInvite' });
        try {
            const { token } = req.body;
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            if (!token) {
                return res.status(400).json({ error: 'Token is required' });
            }

            const result = await InvitationService.acceptInvitation(token, userId);

            res.status(200).json({
                message: 'Invitation accepted successfully',
                ...result
            });

        } catch (error) {
            requestLog.error({ err: error }, 'Error accepting invitation');
            next(error);
        }
    }
}
