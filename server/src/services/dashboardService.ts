import { supabaseAdmin } from '../config/supabase';
import { logger } from '../logger';

export const DashboardService = {
  async getAdminStats(studioId: string) {
    const serviceLogger = logger.child({ service: 'DashboardService', method: 'getAdminStats' });
    serviceLogger.info({ studioId }, 'Fetching admin stats');
    try {
      const [studentsRes, classesRes, revenueRes] = await Promise.all([
        // סה"כ תלמידים
        supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'STUDENT').eq('studio_id', studioId),
        
        // כיתות פעילות
        supabaseAdmin.from('classes').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('studio_id', studioId),

        // הכנסות החודש
        supabaseAdmin.from('payments')
            .select('amount_ils')
            .eq('status', 'COMPLETED')
            .eq('studio_id', studioId)
            .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
      ]);

      if(studentsRes.error) throw studentsRes.error;
      if(classesRes.error) throw classesRes.error;
      if(revenueRes.error) throw revenueRes.error;

      const monthlyRevenue = (revenueRes.data ?? []).reduce(
        (sum: number, payment: { amount_ils: number }) => sum + payment.amount_ils,
        0
      );

      // נתונים לגרף (Hardcoded כרגע לדוגמה, בעתיד שאילתת SQL מורכבת)
      const chartData = [
        { name: 'ינואר', revenue: 4000, attendance: 240 },
        { name: 'פברואר', revenue: 3000, attendance: 139 },
        { name: 'מרץ', revenue: monthlyRevenue || 2000, attendance: 980 },
      ];

      return {
        totalStudents: studentsRes.count || 0,
        activeClasses: classesRes.count || 0,
        monthlyRevenue,
        avgAttendance: 85,
        chartData
      };
    } catch (error) {
      serviceLogger.error({ err: error }, 'Failed to fetch admin stats');
      throw error;
    }
  },

  async getInstructorStats(instructorId: string) {
    const serviceLogger = logger.child({ service: 'DashboardService', method: 'getInstructorStats' });
    serviceLogger.info({ instructorId }, 'Fetching instructor stats');
    try {
      const todayDayOfWeek = new Date().getDay();

      const coursesPromise = supabaseAdmin
        .from('classes')
        .select('*')
        .eq('instructor_id', instructorId)
        .eq('is_active', true);

      const [coursesRes] = await Promise.all([coursesPromise]);

      if(coursesRes.error) throw coursesRes.error;

      const myCourses = (coursesRes.data || []) as Array<{ day_of_week?: number }>;
      const todayClasses = myCourses.filter((course) => course.day_of_week === todayDayOfWeek);
      const nextClass = todayClasses.length > 0 ? todayClasses[0] : null;

      return {
        myCoursesCount: myCourses.length,
        myStudentsCount: 0, // לשיפור בעתיד
        todayClassesCount: todayClasses.length,
        nextClass: nextClass
      };
    } catch (error) {
      serviceLogger.error({ err: error }, 'Failed to fetch instructor stats');
      throw error;
    }
  }
};