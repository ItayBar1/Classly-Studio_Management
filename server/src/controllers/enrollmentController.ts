import { Request, Response, NextFunction } from 'express';
import { EnrollmentService } from '../services/enrollmentService';
import { supabase } from '../config/supabase';

export class EnrollmentController {

    // אדמין רושם תלמיד ידנית
    static async adminEnrollStudent(req: Request, res: Response, next: NextFunction) {
        try {
            const { studentId, classId, notes } = req.body;
            const studioId = req.user.studio_id;

            if (!studentId || !classId) {
                return res.status(400).json({ error: 'Student ID and Class ID are required' });
            }

            const result = await EnrollmentService.enrollStudent(
                studioId,
                studentId,
                classId,
                'ACTIVE', // אדמין רושם ישירות כפעיל
                'PAID',   // הנחה: רישום ידני של אדמין הוא בד"כ לאחר הסדר תשלום (אפשר לשנות לפרמטר)
                notes
            );

            res.status(201).json(result);
        } catch (error: any) {
            next(error);
        }
    }

    // תלמיד נרשם עצמאית (יוצר PENDING)
    static async studentSelfRegister(req: Request, res: Response, next: NextFunction) {
        try {
            const studentId = req.user.id;
            const studioId = req.user.studio_id;
            const { classId } = req.body;

            if (!classId) {
                return res.status(400).json({ error: 'Class ID is required' });
            }

            // יצירת הרשמה בסטטוס ממתין לתשלום
            const result = await EnrollmentService.enrollStudent(
                studioId,
                studentId,
                classId,
                'ACTIVE', // הסטטוס הרשמה הוא ACTIVE, אבל התשלום PENDING? לפי ה-PRD הסטטוס הופך ACTIVE רק אחרי תשלום.
                // נלך לפי ה-PRD: "Create enrollment (PENDING status)"
                'PENDING', 
                'PENDING'  // סטטוס תשלום
            );

            // כאן המקום שבו בעתיד נחזיר גם את ה-ClientSecret של Stripe
            res.status(201).json({ 
                message: 'Registration initiated', 
                enrollment: result 
                // clientSecret: ... (יטופל במודול תשלומים)
            });
        } catch (error: any) {
            next(error);
        }
    }

    // תלמיד צופה בהרשמות שלו
    static async getMyEnrollments(req: Request, res: Response, next: NextFunction) {
        try {
            const studentId = req.user.id;
            const enrollments = await EnrollmentService.getStudentEnrollments(studentId);
            res.json(enrollments);
        } catch (error: any) {
            next(error);
        }
    }

    // קבלת הרשמות לקורס (למדריך/אדמין)
    static async getClassEnrollments(req: Request, res: Response, next: NextFunction) {
        try {
            const { classId } = req.params;
            const userId = req.user.id;

            // למדריך: ווידוא שהקורס שייך לו
            if (req.user.role === 'INSTRUCTOR') {
                const isOwner = await EnrollmentService.verifyInstructorClass(userId, classId);
                if (!isOwner) {
                    return res.status(403).json({ error: 'Not authorized to view enrollments for this class' });
                }
            }

            const enrollments = await EnrollmentService.getClassEnrollments(classId);
            res.json(enrollments);
        } catch (error: any) {
            next(error);
        }
    }

    // ביטול הרשמה
    static async cancelEnrollment(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            await EnrollmentService.cancelEnrollment(id);
            res.json({ message: 'Enrollment cancelled successfully' });
        } catch (error: any) {
            next(error);
        }
    }
}