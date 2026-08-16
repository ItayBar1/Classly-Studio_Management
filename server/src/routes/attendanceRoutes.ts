import { Router } from 'express';
import { AttendanceController } from '../controllers/attendanceController';
import { authenticateUser, requireRole } from '../middleware/authMiddleware';

const router = Router();

// Apply authentication to all attendance routes
router.use(authenticateUser);

/**
 * @route   POST /api/attendance
 * @desc    Record attendance for a class session (bulk upsert)
 * @access  Instructor (own class), Admin (own studio)
 */
router.post('/', requireRole(['INSTRUCTOR', 'ADMIN']), AttendanceController.recordAttendance);

/**
 * @route   GET /api/attendance/sessions
 * @desc    Recent + today's sessions for the logged-in instructor
 * @access  Instructor
 */
router.get('/sessions', requireRole(['INSTRUCTOR']), AttendanceController.getInstructorSessions);

/**
 * @route   GET /api/attendance/overview
 * @desc    Studio-wide attendance overview (sessions, or student-centric when ?studentId=)
 * @access  Admin
 */
router.get('/overview', requireRole(['ADMIN']), AttendanceController.getStudioOverview);

/**
 * @route   GET /api/attendance/class/:classId
 * @desc    Attendance history for a specific class
 * @access  Instructor (own class), Admin (own studio)
 */
router.get('/class/:classId', requireRole(['INSTRUCTOR', 'ADMIN']), AttendanceController.getClassAttendance);

/**
 * @route   GET /api/attendance/my-history
 * @desc    Logged-in student's attendance history
 * @access  Student
 */
router.get('/my-history', requireRole(['STUDENT']), AttendanceController.getStudentHistory);

export default router;
