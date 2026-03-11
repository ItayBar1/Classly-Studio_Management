
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
            // We manually check studio first, then pass studio_id to the service layer.
            // BranchService.update uses a compound where (branch_id + studio_id) for safety.
            const studio = await StudioService.getStudioByAdmin(adminId!);
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
            if (!adminId) return res.status(401).json({ error: "Unauthorized" });
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
