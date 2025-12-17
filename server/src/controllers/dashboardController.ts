import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboardService';
import { logger } from '../logger';

export const DashboardController = {
  getAdminStats: async (req: Request, res: Response, next: NextFunction) => {
    const requestLog = req.logger || logger.child({ controller: 'DashboardController', method: 'getAdminStats' });
    requestLog.info({ studioId: req.studioId }, 'Controller entry');
    try {
      const stats = await DashboardService.getAdminStats(req.studioId);
      requestLog.info('Admin stats fetched successfully');
      res.json(stats);
    } catch (error) {
      requestLog.error({ err: error }, 'Error fetching admin stats');
      next(error);
    }
  },

  getInstructorStats: async (req: Request, res: Response, next: NextFunction) => {
    const requestLog = req.logger || logger.child({ controller: 'DashboardController', method: 'getInstructorStats' });
    requestLog.info({ userId: req.user.id }, 'Controller entry');
    try {
      const stats = await DashboardService.getInstructorStats(req.user.id);
      requestLog.info('Instructor stats fetched successfully');
      res.json(stats);
    } catch (error) {
      requestLog.error({ err: error }, 'Error fetching instructor stats');
      next(error);
    }
  }
};