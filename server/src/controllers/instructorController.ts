import { Request, Response, NextFunction } from 'express';
import { InstructorService } from '../services/instructorService';
import { logger } from '../logger';

export class InstructorController {
    
    // שליפת כל המדריכים (לאדמין)
    static async getAll(req: Request, res: Response, next: NextFunction) {
        const requestLog = req.logger || logger.child({ controller: 'InstructorController', method: 'getAll' });
        requestLog.info({ studioId: req.user.studio_id }, 'Controller entry');
        try {
            const studioId = req.user.studio_id;
            const instructors = await InstructorService.getAllInstructors(studioId);
            requestLog.info({ count: instructors?.length }, 'Fetched instructors');
            res.json(instructors);
        } catch (error: any) {
            requestLog.error({ err: error }, 'Error fetching instructors');
            next(error);
        }
    }

    // שליפת מדריך לפי ID
    static async getById(req: Request, res: Response, next: NextFunction) {
        const requestLog = req.logger || logger.child({ controller: 'InstructorController', method: 'getById' });
        requestLog.info({ params: req.params, userId: req.user.id }, 'Controller entry');
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
            requestLog.info({ instructorId: id }, 'Fetched instructor by id');
            res.json(instructor);
        } catch (error: any) {
            requestLog.error({ err: error }, 'Error fetching instructor');
            next(error);
        }
    }

    // שליפת רווחים/עמלות (למדריך המחובר)
    static async getMyEarnings(req: Request, res: Response, next: NextFunction) {
        const requestLog = req.logger || logger.child({ controller: 'InstructorController', method: 'getMyEarnings' });
        requestLog.info({ userId: req.user.id }, 'Controller entry');
        try {
            const instructorId = req.user.id;
            const earnings = await InstructorService.getEarnings(instructorId);
            requestLog.info({ count: earnings?.length }, 'Fetched instructor earnings');
            res.json(earnings);
        } catch (error: any) {
            requestLog.error({ err: error }, 'Error fetching instructor earnings');
            next(error);
        }
    }

    // מחיקה רכה של מדריך
    static async delete(req: Request, res: Response, next: NextFunction) {
        const requestLog = req.logger || logger.child({ controller: 'InstructorController', method: 'delete' });
        requestLog.info({ params: req.params }, 'Controller entry');
        try {
            const { id } = req.params;
            // כאן נוכל להוסיף בעתיד בדיקה אם למדריך יש שיעורים פעילים לפני מחיקה
            await InstructorService.softDeleteInstructor(id);
            requestLog.info({ instructorId: id }, 'Instructor deactivated');
            res.json({ message: 'Instructor deactivated successfully' });
        } catch (error: any) {
            requestLog.error({ err: error }, 'Error deleting instructor');
            next(error);
        }
    }
}