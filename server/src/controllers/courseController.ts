import { Request, Response, NextFunction } from 'express';
import { CourseService } from '../services/courseService';
import { logger } from '../logger';

export class CourseController {
  
  // Get all courses (optional filters)
  static async getAll(req: Request, res: Response, next: NextFunction) {
    const requestLog = req.logger || logger.child({ controller: 'CourseController', method: 'getAll' });
    requestLog.info({ params: req.params, query: req.query, userRole: req.user?.role }, 'Controller entry');
    try {
      // Students see only active courses; admins see all
      const userRole = req.user?.role;
      const filters = req.query;

      const courses = await CourseService.getAllCourses(userRole, filters);
      requestLog.info({ count: courses?.length }, 'Fetched courses successfully');
      res.json(courses);
    } catch (error: any) {
      requestLog.error({ err: error }, 'Error fetching courses');
      next(error);
    }
  }

  // Get courses available for student registration
  static async getAvailableCourses(req: Request, res: Response, next: NextFunction) {
    const requestLog = req.logger || logger.child({ controller: 'CourseController', method: 'getAvailableCourses' });
    requestLog.info({ userId: req.user.id }, 'Controller entry');
    try {
      const studentId = req.user.id;
      const courses = await CourseService.getAvailableForStudent(studentId);
      requestLog.info({ count: courses?.length }, 'Fetched available courses for student');
      res.json(courses);
    } catch (error: any) {
      requestLog.error({ err: error }, 'Error fetching available courses');
      next(error);
    }
  }

  // Get course by ID
  static async getById(req: Request, res: Response, next: NextFunction) {
    const requestLog = req.logger || logger.child({ controller: 'CourseController', method: 'getById' });
    requestLog.info({ params: req.params }, 'Controller entry');
    try {
      const course = await CourseService.getCourseById(req.params.id);
      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }
      requestLog.info({ courseId: req.params.id }, 'Fetched course by id');
      res.json(course);
    } catch (error: any) {
      requestLog.error({ err: error }, 'Error fetching course by id');
      next(error);
    }
  }

  // Get courses for the instructor
  static async getInstructorCourses(req: Request, res: Response, next: NextFunction) {
    const requestLog = req.logger || logger.child({ controller: 'CourseController', method: 'getInstructorCourses' });
    requestLog.info({ userId: req.user.id }, 'Controller entry');
    try {
      const instructorId = req.user.id;
      const courses = await CourseService.getCoursesByInstructor(instructorId);
      requestLog.info({ count: courses?.length }, 'Fetched instructor courses');
      res.json(courses);
    } catch (error: any) {
      requestLog.error({ err: error }, 'Error fetching instructor courses');
      next(error);
    }
  }

  // Create a new course
  static async create(req: Request, res: Response, next: NextFunction) {
    const requestLog = req.logger || logger.child({ controller: 'CourseController', method: 'create' });
    requestLog.info({ body: req.body, userId: req.user.id }, 'Controller entry');
    try {
      const courseData = req.body;
      const studioId = req.user.studio_id; // Assuming the user belongs to a studio

      const newCourse = await CourseService.createCourse({ ...courseData, studio_id: studioId });
      requestLog.info({ courseId: newCourse?.id }, 'Created course successfully');
      res.status(201).json(newCourse);
    } catch (error: any) {
      requestLog.error({ err: error }, 'Error creating course');
      next(error);
    }
  }

  // Update a course
  static async update(req: Request, res: Response, next: NextFunction) {
    const requestLog = req.logger || logger.child({ controller: 'CourseController', method: 'update' });
    requestLog.info({ params: req.params, body: req.body }, 'Controller entry');
    try {
      const { id } = req.params;
      const updates = req.body;
      const updatedCourse = await CourseService.updateCourse(id, updates);
      requestLog.info({ courseId: id }, 'Updated course successfully');
      res.json(updatedCourse);
    } catch (error: any) {
      requestLog.error({ err: error }, 'Error updating course');
      next(error);
    }
  }

  // Soft delete a course
  static async delete(req: Request, res: Response, next: NextFunction) {
    const requestLog = req.logger || logger.child({ controller: 'CourseController', method: 'delete' });
    requestLog.info({ params: req.params }, 'Controller entry');
    try {
      const { id } = req.params;
      await CourseService.softDeleteCourse(id);
      requestLog.info({ courseId: id }, 'Deactivated course successfully');
      res.json({ message: 'Course deactivated successfully' });
    } catch (error: any) {
      requestLog.error({ err: error }, 'Error deleting course');
      next(error);
    }
  }

  // Enrollment-related functions can move to Student/Enrollment controllers if needed
  // Enrollment currently handled via studentRoutes or dedicated routes; kept for backward compatibility
  static async getEnrolledCourses(req: Request, res: Response, next: NextFunction) {
      const requestLog = req.logger || logger.child({ controller: 'CourseController', method: 'getEnrolledCourses' });
      requestLog.info({ userId: req.user.id }, 'Controller entry');
      // Placeholder until StudentController handles this per PRD
      try {
          const studentId = req.user.id;
          // Redirect to StudentController logic when implemented
          requestLog.info({ studentId }, 'Redirecting to StudentController behavior');
          res.json({ message: "Moved to StudentController" });
      } catch (error: any) {
          requestLog.error({ err: error }, 'Error fetching enrolled courses');
          next(error);
      }
  }
}
