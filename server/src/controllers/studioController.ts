import { Request, Response, NextFunction } from "express";
import { StudioService } from "../services/studioService";

export class StudioController {
  static async create(req: Request, res: Response, next: NextFunction) {
    const requestLog = req.logger!;
    try {
      const adminId = req.user?.id;
      const studioData = req.body;

      if (!adminId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Validations?
      if (!studioData.name) {
        return res.status(400).json({ error: "Studio name is required" });
      }

      const studio = await StudioService.createStudio(adminId, studioData);

      if (!studio) {
        return res.status(500).json({ error: "Failed to create studio" });
      }
      requestLog.info(
        { adminId, studioId: studio.id },
        "Studio created successfully"
      );

      res.status(201).json({
        message: "Studio created successfully",
        studio,
      });
    } catch (error: any) {
      requestLog.error({ err: error }, "Error creating studio");
      // AppError('User already has a studio', 409) reaches the client through
      // errorMiddleware with its own status code.
      next(error);
    }
  }

  static async getMyStudio(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Resolves through users.studio_id and falls back to studio ownership,
      // so a broken link does not look like "this admin has no studio".
      const studio = await StudioService.getStudioForUser(
        userId,
        req.user?.studio_id
      );

      if (!studio) {
        return res
          .status(404)
          .json({ message: "No studio found for this user" });
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
      const studioId = req.user?.studio_id;

      // Security check: Ensure the user belongs to this studio
      if (!studioId || studioId !== id) {
        return res
          .status(403)
          .json({
            error:
              "Forbidden: You do not have permission to update this studio",
          });
      }

      const updatedStudio = await StudioService.updateStudio(id, updates);
      res.status(200).json(updatedStudio);
    } catch (error) {
      next(error);
    }
  }
}
