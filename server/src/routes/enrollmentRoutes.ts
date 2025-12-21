import { Router } from 'express';
import { EnrollmentController } from '../controllers/enrollmentController';
import { authenticateUser, requireRole } from '../middleware/authMiddleware';

const router = Router();

// Apply authentication to all enrollment routes
router.use(authenticateUser);

/**
 * @route   POST /api/enrollments/admin
 * @desc    Admin manually enrolls a student to a class
 * @access  Admin
 */
router.post('/admin', requireRole(['ADMIN']), EnrollmentController.adminEnrollStudent);

/**
 * @route   POST /api/enrollments/register
 * @desc    Student self-registration (Creates PENDING enrollment)
 * @access  Student
 */
router.post('/register', requireRole(['STUDENT']), EnrollmentController.studentSelfRegister);

/**
 * @route   GET /api/enrollments/my-enrollments
 * @desc    Get logged-in student's enrollments
 * @access  Student
 */
router.get('/my-enrollments', requireRole(['STUDENT']), EnrollmentController.getMyEnrollments);

/**
 * @route   GET /api/enrollments/class/:classId
 * @desc    Get all enrollments for a specific class
 * @access  Admin, Instructor (only for their own class)
 */
router.get('/class/:classId', requireRole(['ADMIN', 'INSTRUCTOR']), EnrollmentController.getClassEnrollments);

/**
 * @route   DELETE /api/enrollments/:id
 * @desc    Cancel enrollment (Soft delete / Update status)
 * @access  Admin (Student cancellation usually requires refund logic, so we keep it Admin only or strict logic)
 */
router.delete('/:id', requireRole(['ADMIN']), EnrollmentController.cancelEnrollment);

export default router;
