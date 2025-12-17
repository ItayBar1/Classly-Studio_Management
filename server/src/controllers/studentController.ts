import { Request, Response, NextFunction } from 'express';
import { StudentService } from '../services/studentService';

export const StudentController = {
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, search } = req.query;
      const result = await StudentService.getAll(
        req.studioId, 
        Number(page) || 1, 
        Number(limit) || 50, 
        search as string
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const student = await StudentService.getById(req.params.id);
      res.json(student);
    } catch (error) {
      next(error);
    }
  },

  getByInstructor: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const students = await StudentService.getByInstructor(req.user.id);
      res.json(students);
    } catch (error) {
      next(error);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const newStudent = await StudentService.create(req.studioId, req.body);
      res.status(201).json(newStudent);
    } catch (error: any) {
      next(error);
    }
  }
};