import { Request, Response } from 'express';
import { CourseService } from '../services/courseService';

export const CourseController = {
    async getAll(req: Request, res: Response) {
        try {
            const courses = await CourseService.getCourses();
            res.json(courses);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    },

    async create(req: Request, res: Response) {
        try {
            const { name, capacity } = req.body;
            const course = await CourseService.addCourse(name, capacity);
            res.status(201).json(course);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
};