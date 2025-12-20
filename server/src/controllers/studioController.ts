
import { Request, Response, NextFunction } from 'express';
import { StudioService } from '../services/studioService';
import { logger } from '../logger';

export class StudioController {

    static async create(req: Request, res: Response, next: NextFunction) {
        const requestLog = req.logger || logger.child({ controller: 'StudioController', method: 'create' });
        try {
            const adminId = req.user?.id;
            const studioData = req.body;

            if (!adminId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            // Validations?
            if (!studioData.name) {
                return res.status(400).json({ error: 'Studio name is required' });
            }

            const studio = await StudioService.createStudio(adminId, studioData);

            logger.info({ adminId, studioId: studio.id }, 'Studio created successfully');

            res.status(201).json({
                message: 'Studio created successfully',
                studio
            });

        } catch (error: any) {
            requestLog.error({ err: error }, 'Error creating studio');
            if (error.message === 'User already has a studio') {
                return res.status(409).json({ error: error.message });
            }
            next(error);
        }
    }

    static async getMyStudio(req: Request, res: Response, next: NextFunction) {
        try {
            const adminId = req.user?.id;
            if (!adminId) return res.status(401).json({ error: 'Unauthorized' });

            const studio = await StudioService.getStudioByAdmin(adminId);

            if (!studio) {
                return res.status(404).json({ message: 'No studio found for this admin' });
            }

            res.status(200).json(studio);
        } catch (error) {
            next(error);
        }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const updates = req.body;
            const adminId = req.user?.id;

            // Security check: Ensure the user owns this studio
            // In a real app we might fetch the studio first or use RLS if we were querying directly.
            // Here we trust the service/db to enforce or we check it.
            const currentStudio = await StudioService.getStudioByAdmin(adminId!);

            if (!currentStudio || currentStudio.id !== id) {
                return res.status(403).json({ error: 'Forbidden: You do not own this studio' });
            }

            const updatedStudio = await StudioService.updateStudio(id, updates);
            res.status(200).json(updatedStudio);

        } catch (error) {
            next(error);
        }
    }
}
