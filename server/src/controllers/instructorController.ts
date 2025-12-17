import { Request, Response } from 'express';
import { InstructorService } from '../services/instructorService';

export class InstructorController {
    
    // שליפת כל המדריכים (לאדמין)
    static async getAll(req: Request, res: Response) {
        try {
            const studioId = req.user.studio_id;
            const instructors = await InstructorService.getAllInstructors(studioId);
            res.json(instructors);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // שליפת מדריך לפי ID
    static async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const requestingUser = req.user;

            // בדיקת הרשאה: רק אדמין או המדריך עצמו יכולים לצפות בפרטים
            if (requestingUser.role !== 'ADMIN' && requestingUser.id !== id) {
                return res.status(403).json({ error: 'Unauthorized access to instructor profile' });
            }

            const instructor = await InstructorService.getInstructorById(id);
            if (!instructor) {
                return res.status(404).json({ error: 'Instructor not found' });
            }
            res.json(instructor);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // שליפת רווחים/עמלות (למדריך המחובר)
    static async getMyEarnings(req: Request, res: Response) {
        try {
            const instructorId = req.user.id;
            const earnings = await InstructorService.getEarnings(instructorId);
            res.json(earnings);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // מחיקה רכה של מדריך
    static async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            // כאן נוכל להוסיף בעתיד בדיקה אם למדריך יש שיעורים פעילים לפני מחיקה
            await InstructorService.softDeleteInstructor(id);
            res.json({ message: 'Instructor deactivated successfully' });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}