
import { Request, Response, NextFunction } from 'express';
import { BranchService } from '../services/branchService';
import { StudioService } from '../services/studioService';

export class BranchController {

    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const adminId = req.user?.id;
            // Get studio for this admin to ensure security
            const studio = await StudioService.getStudioByAdmin(adminId!);

            if (!studio) {
                return res.status(404).json({ error: 'Studio not found' });
            }

            const branches = await BranchService.getAll(studio.id);
            res.json(branches);
        } catch (error) {
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const adminId = req.user?.id;
            const branchData = req.body;

            const studio = await StudioService.getStudioByAdmin(adminId!);
            if (!studio) {
                return res.status(404).json({ error: 'Studio not found' });
            }

            const branch = await BranchService.create(studio.id, branchData);
            res.status(201).json(branch);
        } catch (error) {
            next(error);
        }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const adminId = req.user?.id;
            const { id } = req.params;
            const updates = req.body;

            // Security: Verify studio ownership implies branch ownership
            const studio = await StudioService.getStudioByAdmin(adminId!);
            // In a real optimized app we'd check branch ownership directly via query 
            // "update branches where id=X and studio_id=Y". 
            // Supabase RLS handles this if we used the user token, but we use Admin client here.
            // Relying on RLS if possible is good, but here we manually check studio first.
            if (!studio) return res.status(403).json({ error: 'Forbidden' });

            const branch = await BranchService.update(id, studio.id, updates);
            res.json(branch);
        } catch (error) {
            next(error);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const adminId = req.user?.id;
            const { id } = req.params;

            const studio = await StudioService.getStudioByAdmin(adminId!);
            if (!studio) return res.status(403).json({ error: 'Forbidden' });

            await BranchService.delete(id, studio.id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}
