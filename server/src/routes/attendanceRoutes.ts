import { Router } from 'express';
import { AttendanceController } from '../controllers/attendanceController';
import { authenticateUser, requireRole } from '../middleware/authMiddleware';

const router = Router();

// Apply authentication to all attendance routes
router.use(authenticateUser);

/**
 * @route   POST /api/attendance
 * @desc    Record attendance for a class session (Bulk upsert)
 * @access  Instructor
 */
router.post('/', requireRole(['INSTRUCTOR']), AttendanceController.recordAttendance);

/**
 * @route   GET /api/attendance/class/:classId
 * @desc    Get attendance history for a specific class
 * @access  Instructor (own class), Admin
 */
router.get('/class/:classId', requireRole(['INSTRUCTOR', 'ADMIN']), AttendanceController.getClassAttendance);

/**
 * @route   GET /api/attendance/my-history
 * @desc    Get logged-in student's attendance history
 * @access  Student
 */
router.get('/my-history', requireRole(['STUDENT']), AttendanceController.getStudentHistory);

export default router;
