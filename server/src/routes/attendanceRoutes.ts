import { Router } from 'express';
import { AttendanceController } from '../controllers/attendanceController';
import { authenticateUser, requireRole } from '../middleware/authMiddleware';

const router = Router();
router.use(authenticateUser);

// Instructor: Submit attendance for a class session
router.post('/', requireRole(['INSTRUCTOR']), AttendanceController.recordAttendance);

// Student: View own attendance
router.get('/my-history', requireRole(['STUDENT']), AttendanceController.getStudentHistory);

// Instructor: View attendance for specific class
router.get('/class/:classId', requireRole(['INSTRUCTOR', 'ADMIN']), AttendanceController.getClassAttendance);

export default router;