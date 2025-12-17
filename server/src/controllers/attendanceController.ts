import { Request, Response, NextFunction } from 'express';
import { AttendanceService } from '../services/attendanceService';
import { supabase } from '../config/supabase';
import { logger } from '../logger';

export class AttendanceController {

    // דיווח נוכחות (יצירה או עדכון)
    static async recordAttendance(req: Request, res: Response, next: NextFunction) {
        const requestLog = req.logger || logger.child({ controller: 'AttendanceController', method: 'recordAttendance' });
        requestLog.info({ body: req.body, userId: req.user.id }, 'Controller entry');
        try {
            const instructorId = req.user.id;
            const { classId, date, records } = req.body;
            // records format: [{ studentId: '...', status: 'PRESENT', notes: '...' }]

            if (!classId || !date || !Array.isArray(records)) {
                return res.status(400).json({ error: 'Missing required fields: classId, date, or records array' });
            }

            // אימות שהמדריך הוא אכן המדריך של הקורס (אלא אם הוא אדמין)
            // (בדיקה זו יכולה להתבצע גם ב-Service, אך כאן זה חוסך קריאה אם המידע לא תקין)
            // לצורך הפשטות נסמוך על ה-Service שיבדוק או על RLS, אך נוסיף בדיקה בסיסית:
            const isAuthorized = await AttendanceController.verifyInstructorForClass(instructorId, classId);
            if (!isAuthorized && req.user.role !== 'ADMIN') {
                requestLog.warn({ instructorId, classId }, 'Unauthorized attendance attempt');
                return res.status(403).json({ error: 'You are not the instructor of this class' });
            }

            const result = await AttendanceService.recordAttendance(classId, date, instructorId, records);
            requestLog.info({ count: result.length }, 'Attendance recorded successfully');
            res.json({ message: 'Attendance recorded successfully', count: result.length });
        } catch (error: any) {
            requestLog.error({ err: error }, 'Error recording attendance');
            next(error);
        }
    }

    // קבלת היסטוריה עבור כיתה ספציפית
    static async getClassAttendance(req: Request, res: Response, next: NextFunction) {
        const requestLog = req.logger || logger.child({ controller: 'AttendanceController', method: 'getClassAttendance' });
        requestLog.info({ params: req.params, query: req.query, userId: req.user.id }, 'Controller entry');
        try {
            const { classId } = req.params;
            const { date } = req.query; // אופציונלי: סינון לפי תאריך
            const instructorId = req.user.id;

            // בדיקת הרשאה
            if (req.user.role === 'INSTRUCTOR') {
                 const isAuthorized = await AttendanceController.verifyInstructorForClass(instructorId, classId);
                 if (!isAuthorized) return res.status(403).json({ error: 'Unauthorized' });
            }

            const data = await AttendanceService.getClassAttendance(classId, date as string);
            requestLog.info({ classId, count: data?.length }, 'Class attendance fetched successfully');
            res.json(data);
        } catch (error: any) {
            requestLog.error({ err: error }, 'Error fetching class attendance');
            next(error);
        }
    }

    // קבלת היסטוריה לתלמיד המחובר
    static async getStudentHistory(req: Request, res: Response, next: NextFunction) {
        const requestLog = req.logger || logger.child({ controller: 'AttendanceController', method: 'getStudentHistory' });
        requestLog.info({ userId: req.user.id }, 'Controller entry');
        try {
            const studentId = req.user.id;
            const history = await AttendanceService.getStudentHistory(studentId);
            requestLog.info({ count: history?.length }, 'Student attendance history fetched');
            res.json(history);
        } catch (error: any) {
            requestLog.error({ err: error }, 'Error fetching student attendance history');
            next(error);
        }
    }

    // Helper: בדיקה שהמדריך משויך לקורס
    private static async verifyInstructorForClass(instructorId: string, classId: string): Promise<boolean> {
        const { data } = await supabase
            .from('classes')
            .select('instructor_id')
            .eq('id', classId)
            .single();
        
        return data?.instructor_id === instructorId;
    }
}