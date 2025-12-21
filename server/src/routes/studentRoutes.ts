import { Router } from 'express';
import { StudentController } from '../controllers/studentController';
import { authenticateUser, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateUser);

// Admin routes
router.get('/', requireRole(['ADMIN']), StudentController.getAll);
router.post('/', requireRole(['ADMIN']), StudentController.create);
/**
 * @route   DELETE /api/students/:id
 * @desc    Soft delete a student (change status to INACTIVE)
 * @access  Admin
 */
router.delete('/:id', requireRole(['ADMIN']), StudentController.delete);

// Instructor route (must precede :id to avoid being treated as an ID)
router.get('/my-students', requireRole(['INSTRUCTOR', 'ADMIN']), StudentController.getByInstructor);

// Specific student details
router.get('/:id', requireRole(['ADMIN', 'INSTRUCTOR']), StudentController.getById);

export default router;
