import { Request, Response, NextFunction } from 'express';
import { CourseService } from '../services/courseService';

export class CourseController {
  
  // קבלת כל הקורסים (עם סינון אופציונלי)
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      // אם המשתמש הוא סטודנט, נחזיר רק קורסים פעילים (לפי PRD)
      // אם אדמין, נחזיר הכל.
      const userRole = req.user?.role;
      const filters = req.query;
      
      const courses = await CourseService.getAllCourses(userRole, filters);
      res.json(courses);
    } catch (error: any) {
      next(error);
    }
  }

  // קבלת קורסים זמינים להרשמה (עבור סטודנט)
  static async getAvailableCourses(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user.id;
      const courses = await CourseService.getAvailableForStudent(studentId);
      res.json(courses);
    } catch (error: any) {
      next(error);
    }
  }

  // קבלת קורס לפי ID
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const course = await CourseService.getCourseById(req.params.id);
      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }
      res.json(course);
    } catch (error: any) {
      next(error);
    }
  }

  // קבלת קורסים של מדריך ספציפי
  static async getInstructorCourses(req: Request, res: Response, next: NextFunction) {
    try {
      const instructorId = req.user.id;
      const courses = await CourseService.getCoursesByInstructor(instructorId);
      res.json(courses);
    } catch (error: any) {
      next(error);
    }
  }

  // יצירת קורס חדש
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const courseData = req.body;
      const studioId = req.user.studio_id; // בהנחה שהמשתמש משויך לסטודיו
      
      const newCourse = await CourseService.createCourse({ ...courseData, studio_id: studioId });
      res.status(201).json(newCourse);
    } catch (error: any) {
      next(error);
    }
  }

  // עריכת קורס
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updatedCourse = await CourseService.updateCourse(id, updates);
      res.json(updatedCourse);
    } catch (error: any) {
      next(error);
    }
  }

  // מחיקת קורס (Soft Delete)
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await CourseService.softDeleteCourse(id);
      res.json({ message: 'Course deactivated successfully' });
    } catch (error: any) {
      next(error);
    }
  }

  // פונקציות הרשמה יועברו לקונטרולר Enrollments/Student בהמשך, או יישארו כאן אם תחליט
  // כרגע ב-PRD ההרשמה מתבצעת דרך studentRoutes או נתיב ייעודי, אבל נשאיר תמיכה לאחור אם היה קיים
  static async getEnrolledCourses(req: Request, res: Response, next: NextFunction) {
      // זה אמור להיות מטופל ב-StudentController לפי ה-PRD המעודכן, אך לבינתיים:
      try {
          const studentId = req.user.id;
          // קריאה לשירות מתאים (נממש בהמשך ב-StudentService)
          res.json({ message: "Moved to StudentController" });
      } catch (error: any) {
          next(error);
      }
  }
}