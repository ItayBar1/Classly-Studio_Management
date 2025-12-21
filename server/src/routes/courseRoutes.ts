import { Router } from 'express';
import { CourseController } from '../controllers/courseController';
import { authenticateUser, requireRole } from '../middleware/authMiddleware';

const router = Router();

// Apply authentication to all course routes
router.use(authenticateUser);

/**
 * @route   GET /api/courses
 * @desc    Get all courses (Admin sees all, others see active/relevant)
 * @access  Admin, Instructor, Student
 */
router.get('/', CourseController.getAll);

/**
 * @route   GET /api/courses/my-courses
 * @desc    Get courses for the logged-in instructor
 * @access  Instructor, Admin
 */
router.get('/my-courses', requireRole(['INSTRUCTOR', 'ADMIN']), CourseController.getInstructorCourses);

/**
 * @route   GET /api/courses/available
 * @desc    Get available courses for student registration
 * @access  Student
 */
router.get('/available', requireRole(['STUDENT']), CourseController.getAvailableCourses);

/**
 * @route   GET /api/courses/:id
 * @desc    Get single course details
 * @access  All authenticated users
 */
router.get('/:id', CourseController.getById);

/**
 * @route   POST /api/courses
 * @desc    Create a new course
 * @access  Admin
 */
router.post('/', requireRole(['ADMIN']), CourseController.create);

/**
 * @route   PATCH /api/courses/:id
 * @desc    Update a course
 * @access  Admin
 */
router.patch('/:id', requireRole(['ADMIN']), CourseController.update);

/**
 * @route   DELETE /api/courses/:id
 * @desc    Soft delete a course (set is_active = false)
 * @access  Admin
 */
router.delete('/:id', requireRole(['ADMIN']), CourseController.delete);

export default router;
