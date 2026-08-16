import { Request, Response, NextFunction } from "express";
import { BranchService } from "../services/branchService";
import { StudioService } from "../services/studioService";

export class BranchController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const studioId = req.user?.studio_id;
      // A user without a studio simply has no branches. Answering 404 here
      // made the admin screen believe the studio itself was missing and
      // render the "create your studio" onboarding form instead.
      if (!studioId) {
        return res.json([]);
      }

      const branches = await BranchService.getAll(studioId);
      res.json(branches);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const studioId = req.user?.studio_id;
      const branchData = req.body;

      if (!studioId) {
        return res.status(404).json({ error: "Studio not found" });
      }

      const branch = await BranchService.create(studioId, branchData);
      res.status(201).json(branch);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const studioId = req.user?.studio_id;
      const { id } = req.params;
      const updates = req.body;

      // Security: Verify studio ownership implies branch ownership
      if (!studioId) return res.status(403).json({ error: "Forbidden" });

      const branch = await BranchService.update(id, studioId, updates);
      res.json(branch);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const studioId = req.user?.studio_id;
      if (!studioId) return res.status(401).json({ error: "Unauthorized" });
      const { id } = req.params;

      await BranchService.delete(id, studioId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
