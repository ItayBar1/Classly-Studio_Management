import { supabaseAdmin as supabase} from '../config/supabase';
import { logger } from '../logger';

interface AttendanceRecord {
    studentId: string;
    status: 'PRESENT' | 'ABSENT' | 'EXCUSED' | 'LATE';
    notes?: string;
}

export class AttendanceService {

    /**
     * Record attendance (Upsert).
     * Automatically fetches enrollment_id for each student to satisfy DB constraints.
     */
    static async recordAttendance(classId: string, date: string, instructorId: string, records: AttendanceRecord[]) {
        const serviceLogger = logger.child({ service: 'AttendanceService', method: 'recordAttendance' });
        serviceLogger.info({ classId, date, instructorId, recordCount: records.length }, 'Recording attendance');
        // 1. שליפת ה-enrollment_id עבור התלמידים בקורס זה
        const studentIds = records.map(r => r.studentId);
        
        const { data: enrollments, error: enrollError } = await supabase
            .from('enrollments')
            .select('id, student_id')
            .eq('class_id', classId)
            .in('student_id', studentIds);

        if (enrollError) {
            serviceLogger.error({ err: enrollError }, 'Error fetching enrollments for attendance');
            throw new Error(`Error fetching enrollments: ${enrollError.message}`);
        }

        // יצירת מפה (Map) לגישה מהירה: studentId -> enrollmentId
        const enrollmentMap = new Map<string, string>(
            (enrollments ?? []).map(({ student_id, id }: { student_id: string; id: string }) => [student_id, id])
        );

        // 2. הכנת המידע להכנסה (Upsert Data)
        const upsertData = records.map(record => {
            const enrollmentId = enrollmentMap.get(record.studentId);

            // אם אין הרשמה, אי אפשר לרשום נוכחות (לפי ה-PRD)
            if (!enrollmentId) {
                serviceLogger.warn({ studentId: record.studentId, classId }, 'Skipping attendance: enrollment not found');
                return null;
            }

            return {
                studio_id: undefined, // מתעדכן בהמשך לאחר שליפת ה-studio_id של הכיתה
                class_id: classId,
                instructor_id: instructorId,
                enrollment_id: enrollmentId,
                student_id: record.studentId,
                session_date: date,
                status: record.status,
                notes: record.notes,
                recorded_by: instructorId,
                recorded_at: new Date().toISOString()
            };
        }).filter(item => item !== null); // מסנן את אלו ללא הרשמה

        // שלב 0 (השלמה): שליפת ה-studio_id כדי למלא את השדה חובה
        if (upsertData.length > 0) {
            const { data: classData, error: classError } = await supabase.from('classes').select('studio_id').eq('id', classId).single();
            if (classError) {
                serviceLogger.error({ err: classError }, 'Failed to fetch class for studio assignment');
                throw new Error(classError.message);
            }
            if (classData) {
                upsertData.forEach(item => item!.studio_id = classData.studio_id);
            }
        }

        // 3. ביצוע ה-Upsert
        const { data, error } = await supabase
            .from('attendance')
            .upsert(upsertData, { onConflict: 'enrollment_id, session_date' }) // לפי האינדקס ב-PRD
            .select();

        if (error) {
            serviceLogger.error({ err: error }, 'Failed to upsert attendance');
            throw new Error(error.message);
        }
        return data;
    }

    /**
     * Get attendance for a specific class
     */
    static async getClassAttendance(classId: string, date?: string) {
        const serviceLogger = logger.child({ service: 'AttendanceService', method: 'getClassAttendance' });
        serviceLogger.info({ classId, date }, 'Fetching class attendance');
        let query = supabase
            .from('attendance')
            .select(`
                *,
                student:users!student_id(full_name, profile_image_url)
            `)
            .eq('class_id', classId)
            .order('session_date', { ascending: false });

        if (date) {
            query = query.eq('session_date', date);
        }

        const { data, error } = await query;
        if (error) {
            serviceLogger.error({ err: error }, 'Failed to fetch class attendance');
            throw new Error(error.message);
        }
        serviceLogger.info({ count: data?.length }, 'Class attendance fetched');
        return data;
    }

    /**
     * Get attendance history for a student
     */
    static async getStudentHistory(studentId: string) {
        const serviceLogger = logger.child({ service: 'AttendanceService', method: 'getStudentHistory' });
        serviceLogger.info({ studentId }, 'Fetching student attendance history');
        const { data, error } = await supabase
            .from('attendance')
            .select(`
                session_date,
                status,
                notes,
                class:classes(name, start_time, end_time)
            `)
            .eq('student_id', studentId)
            .order('session_date', { ascending: false });

        if (error) {
            serviceLogger.error({ err: error }, 'Failed to fetch student attendance history');
            throw new Error(error.message);
        }
        serviceLogger.info({ count: data?.length }, 'Student attendance history fetched');
        return data;
    }
}