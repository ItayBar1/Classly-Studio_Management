import { Router } from 'express';
import { InstructorController } from '../controllers/instructorController';
import { authenticateUser, requireRole } from '../middleware/authMiddleware';

const router = Router();
router.use(authenticateUser);

// Admin only: Get all instructors & Delete instructor
router.get('/', requireRole(['ADMIN']), InstructorController.getAllInstructors);
router.delete('/:id', requireRole(['ADMIN']), InstructorController.deleteInstructor);

// Instructor: Get own earnings (Missing feature)
router.get('/earnings', requireRole(['INSTRUCTOR']), InstructorController.getEarnings);

export default router;