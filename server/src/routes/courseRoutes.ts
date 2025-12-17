import { Router } from 'express';
import { CourseController } from '../controllers/courseController';
import { authenticateUser, requireRole } from '../middleware/authMiddleware';

const router = Router();

// כל הנתיבים דורשים אימות
router.use(authenticateUser);

// נתיבים כלליים
router.get('/', CourseController.getAll);

// נתיבים למדריך
router.get('/my-courses', requireRole(['INSTRUCTOR', 'ADMIN']), CourseController.getInstructorCourses);

// נתיבים לתלמיד
router.get('/enrolled', requireRole(['STUDENT', 'ADMIN']), CourseController.getEnrolledCourses);
router.post('/enroll', requireRole(['STUDENT']), CourseController.enroll);

// נתיבי אדמין
router.post('/', requireRole(['ADMIN']), CourseController.create);

// הוסף לנתיבים הקיימים:
router.get('/:id', authenticateUser, CourseController.getById); // Get details
router.patch('/:id', requireRole(['ADMIN']), CourseController.update); // Edit
router.delete('/:id', requireRole(['ADMIN']), CourseController.delete); // Soft Delete

export default router;