import { Router } from 'express';
import { DashboardController } from '../controllers/dashboardController';
import { authenticateUser, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateUser);

router.get('/admin', requireRole(['ADMIN']), DashboardController.getAdminStats);
router.get('/instructor', requireRole(['INSTRUCTOR', 'ADMIN']), DashboardController.getInstructorStats);

export default router;