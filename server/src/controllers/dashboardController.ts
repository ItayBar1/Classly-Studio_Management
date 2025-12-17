import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboardService';

export const DashboardController = {
  getAdminStats: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await DashboardService.getAdminStats(req.studioId);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  },

  getInstructorStats: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await DashboardService.getInstructorStats(req.user.id);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
};