import { Request, Response, NextFunction } from 'express';
import { AttendanceService } from '../services/attendanceService';
import { supabaseAdmin as supabase} from '../config/supabase';
import { logger } from '../logger';

export class AttendanceController {

    // Record attendance (create or update)
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

            // Validate instructor owns the class (unless admin)
            // Basic guard before calling service to avoid unnecessary work
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

    // Get attendance history for a specific class
    static async getClassAttendance(req: Request, res: Response, next: NextFunction) {
        const requestLog = req.logger || logger.child({ controller: 'AttendanceController', method: 'getClassAttendance' });
        requestLog.info({ params: req.params, query: req.query, userId: req.user.id }, 'Controller entry');
        try {
            const { classId } = req.params;
            const { date } = req.query; // Optional: date filter
            const instructorId = req.user.id;

            // Authorization check
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

    // Get attendance history for the authenticated student
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

    // Helper: ensure instructor is assigned to the class
    private static async verifyInstructorForClass(instructorId: string, classId: string): Promise<boolean> {
        const { data } = await supabase
            .from('classes')
            .select('instructor_id')
            .eq('id', classId)
            .single();
        
        return data?.instructor_id === instructorId;
    }
}
