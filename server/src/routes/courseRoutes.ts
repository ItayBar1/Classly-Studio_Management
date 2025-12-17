import { Router } from 'express';
import { CourseController } from '../controllers/courseController';
import { authenticateUser, requireRole } from '../middleware/authMiddleware';

const router = Router();

// כל הנתיבים דורשים אימות (טוקן)
router.use(authenticateUser);

// GET פתוח לכולם (הסינון קורה בתוך הקונטרולר)
router.get('/', CourseController.getAll);

// POST מוגבל רק לאדמין
router.post('/', requireRole(['ADMIN']), CourseController.create);

export default router;