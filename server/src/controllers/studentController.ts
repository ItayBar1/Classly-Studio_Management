import { Request, Response, NextFunction } from "express";
import { StudentService } from "../services/studentService";
import { logger } from "../logger";

export const StudentController = {
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    const requestLog = req.logger || logger.child({ controller: "StudentController", method: "getAll" });
    requestLog.info({ params: req.params, query: req.query }, "Controller entry");
    try {
      if (!req.studioId) {
        res.status(400).json({ error: "Studio ID is missing" });
        return;
      }
      const { page, limit, search } = req.query;
      const result = await StudentService.getAll(
        req.studioId,
        Number(page) || 1,
        Number(limit) || 50,
        search as string
      );
      requestLog.info({ count: result.count }, "Fetched students successfully");
      res.json(result);
    } catch (error) {
      requestLog.error({ err: error }, "Error fetching students");
      next(error);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    const requestLog = req.logger || logger.child({ controller: "StudentController", method: "getById" });
    requestLog.info({ params: req.params }, "Controller entry");
    try {
      const student = await StudentService.getById(req.params.id);
      requestLog.info({ studentId: req.params.id }, "Fetched student successfully");
      res.json(student);
    } catch (error) {
      requestLog.error({ err: error }, "Error fetching student by id");
      next(error);
    }
  },

  getByInstructor: async (req: Request, res: Response, next: NextFunction) => {
    const requestLog = req.logger || logger.child({ controller: "StudentController", method: "getByInstructor" });
    requestLog.info({ userId: req.user.id }, "Controller entry");
    try {
      const students = await StudentService.getByInstructor(req.user.id);
      requestLog.info({ count: students.length }, "Fetched instructor students successfully");
      res.json(students);
    } catch (error) {
      requestLog.error({ err: error }, "Error fetching instructor students");
      next(error);
    }
  },

  /**
   * מחיקת תלמיד (Soft Delete)
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    const requestLog = req.logger || logger.child({ controller: "StudentController", method: "delete" });
    requestLog.info({ params: req.params }, "Controller entry");
    try {
      const { id } = req.params;

      if (!id) {
        requestLog.warn("Student ID is required for deletion");
        res.status(400).json({ error: "Student ID is required" });
        return;
      }

      const deletedStudent = await StudentService.deleteStudent(id);

      requestLog.info({ studentId: id }, "Student deleted successfully");
      res.status(200).json({
        message: "Student deleted successfully (Soft Delete)",
        student: deletedStudent,
      });
    } catch (error: any) {
      requestLog.error({ err: error }, "Error deleting student");
      return next(error);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    const requestLog = req.logger || logger.child({ controller: "StudentController", method: "create" });
    requestLog.info({ body: req.body, studioId: req.studioId }, "Controller entry");
    try {
      if (!req.studioId) {
         res.status(400).json({ error: "Studio ID is missing from request" });
         return;
      }
      
      const newStudent = await StudentService.create(req.studioId, req.body);
      requestLog.info({ studentId: newStudent?.id }, "Student created successfully");
      res.status(201).json(newStudent);
    } catch (error: any) {
      requestLog.error({ err: error }, "Error creating student");
      next(error);
    }
  },
};
