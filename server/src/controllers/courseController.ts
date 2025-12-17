import { Request, Response, NextFunction } from 'express';
import { CourseService } from '../services/courseService';
import { logger } from '../logger';

export class CourseController {
  
  // קבלת כל הקורסים (עם סינון אופציונלי)
  static async getAll(req: Request, res: Response, next: NextFunction) {
    const requestLog = req.logger || logger.child({ controller: 'CourseController', method: 'getAll' });
    requestLog.info({ params: req.params, query: req.query, userRole: req.user?.role }, 'Controller entry');
    try {
      // אם המשתמש הוא סטודנט, נחזיר רק קורסים פעילים (לפי PRD)
      // אם אדמין, נחזיר הכל.
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

  // קבלת קורסים זמינים להרשמה (עבור סטודנט)
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

  // קבלת קורס לפי ID
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

  // קבלת קורסים של מדריך ספציפי
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

  // יצירת קורס חדש
  static async create(req: Request, res: Response, next: NextFunction) {
    const requestLog = req.logger || logger.child({ controller: 'CourseController', method: 'create' });
    requestLog.info({ body: req.body, userId: req.user.id }, 'Controller entry');
    try {
      const courseData = req.body;
      const studioId = req.user.studio_id; // בהנחה שהמשתמש משויך לסטודיו

      const newCourse = await CourseService.createCourse({ ...courseData, studio_id: studioId });
      requestLog.info({ courseId: newCourse?.id }, 'Created course successfully');
      res.status(201).json(newCourse);
    } catch (error: any) {
      requestLog.error({ err: error }, 'Error creating course');
      next(error);
    }
  }

  // עריכת קורס
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

  // מחיקת קורס (Soft Delete)
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

  // פונקציות הרשמה יועברו לקונטרולר Enrollments/Student בהמשך, או יישארו כאן אם תחליט
  // כרגע ב-PRD ההרשמה מתבצעת דרך studentRoutes או נתיב ייעודי, אבל נשאיר תמיכה לאחור אם היה קיים
  static async getEnrolledCourses(req: Request, res: Response, next: NextFunction) {
      const requestLog = req.logger || logger.child({ controller: 'CourseController', method: 'getEnrolledCourses' });
      requestLog.info({ userId: req.user.id }, 'Controller entry');
      // זה אמור להיות מטופל ב-StudentController לפי ה-PRD המעודכן, אך לבינתיים:
      try {
          const studentId = req.user.id;
          // קריאה לשירות מתאים (נממש בהמשך ב-StudentService)
          requestLog.info({ studentId }, 'Redirecting to StudentController behavior');
          res.json({ message: "Moved to StudentController" });
      } catch (error: any) {
          requestLog.error({ err: error }, 'Error fetching enrolled courses');
          next(error);
      }
  }
}