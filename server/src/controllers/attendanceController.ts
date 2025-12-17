import { Request, Response, NextFunction } from 'express';
import { AttendanceService } from '../services/attendanceService';
import { supabase } from '../config/supabase';

export class AttendanceController {

    // דיווח נוכחות (יצירה או עדכון)
    static async recordAttendance(req: Request, res: Response, next: NextFunction) {
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
                return res.status(403).json({ error: 'You are not the instructor of this class' });
            }

            const result = await AttendanceService.recordAttendance(classId, date, instructorId, records);
            res.json({ message: 'Attendance recorded successfully', count: result.length });
        } catch (error: any) {
            next(error);
        }
    }

    // קבלת היסטוריה עבור כיתה ספציפית
    static async getClassAttendance(req: Request, res: Response, next: NextFunction) {
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
            res.json(data);
        } catch (error: any) {
            next(error);
        }
    }

    // קבלת היסטוריה לתלמיד המחובר
    static async getStudentHistory(req: Request, res: Response, next: NextFunction) {
        try {
            const studentId = req.user.id;
            const history = await AttendanceService.getStudentHistory(studentId);
            res.json(history);
        } catch (error: any) {
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