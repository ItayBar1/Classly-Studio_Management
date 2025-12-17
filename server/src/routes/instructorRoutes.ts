import { Router } from 'express';
import { InstructorController } from '../controllers/instructorController';
import { authenticateUser, requireRole } from '../middleware/authMiddleware';

const router = Router();

// החלת אימות על כל הנתיבים בקובץ זה
router.use(authenticateUser);

/**
 * @route   GET /api/instructors
 * @desc    Get all instructors (Admin only)
 * @access  Admin
 */
router.get('/', requireRole(['ADMIN']), InstructorController.getAll);

/**
 * @route   GET /api/instructors/earnings
 * @desc    Get logged-in instructor's earnings/commissions
 * @access  Instructor
 */
router.get('/earnings', requireRole(['INSTRUCTOR']), InstructorController.getMyEarnings);

/**
 * @route   GET /api/instructors/:id
 * @desc    Get specific instructor details
 * @access  Admin (or Instructor looking at themselves - logic in controller)
 */
router.get('/:id', requireRole(['ADMIN', 'INSTRUCTOR']), InstructorController.getById);

/**
 * @route   DELETE /api/instructors/:id
 * @desc    Soft delete instructor (change status to INACTIVE)
 * @access  Admin
 */
router.delete('/:id', requireRole(['ADMIN']), InstructorController.delete);

export default router;