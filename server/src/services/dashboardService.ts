import { supabaseAdmin } from "../config/supabase";
import { logger } from "../logger";

// Helper to calculate next occurrence date of a class
const getNextClassDate = (dayOfWeek: number, startTime: string): Date => {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday
  const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(startTime.trim());
  if (!timeMatch) {
    throw new Error(`Invalid startTime format (expected HH:MM): "${startTime}"`);
  }
  const hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2]);
  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    throw new Error(`Invalid startTime value (out of range): "${startTime}"`);
  }

  let daysUntil = dayOfWeek - currentDay;

  // If the class is today, check if the time has passed
  if (daysUntil === 0) {
    const classTime = new Date(now);
    classTime.setHours(hours, minutes, 0, 0);
    if (classTime <= now) {
      daysUntil = 7; // It's next week
    }
  } else if (daysUntil < 0) {
    daysUntil += 7; // Next week
  }

  const nextDate = new Date(now);
  nextDate.setDate(now.getDate() + daysUntil);
  nextDate.setHours(hours, minutes, 0, 0);

  return nextDate;
};

export const DashboardService = {
  async getAdminStats(studioId: string) {
    const serviceLogger = logger.child({
      service: "DashboardService",
      method: "getAdminStats",
    });
    serviceLogger.info({ studioId }, "Fetching admin stats");
    try {
      const [studentsRes, classesRes, revenueRes] = await Promise.all([
        // Total students
        supabaseAdmin
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("role", "STUDENT")
          .eq("studio_id", studioId),

        // Active classes
        supabaseAdmin
          .from("classes")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true)
          .eq("studio_id", studioId),

        // Current month revenue
        supabaseAdmin
          .from("payments")
          .select("amount_ils")
          .eq("status", "COMPLETED")
          .eq("studio_id", studioId)
          .gte(
            "created_at",
            new Date(
              new Date().getFullYear(),
              new Date().getMonth(),
              1
            ).toISOString()
          ),
      ]);

      if (studentsRes.error) throw studentsRes.error;
      if (classesRes.error) throw classesRes.error;
      if (revenueRes.error) throw revenueRes.error;

      const monthlyRevenue = (revenueRes.data ?? []).reduce(
        (sum: number, payment: { amount_ils: number }) =>
          sum + payment.amount_ils,
        0
      );

      // Chart data placeholder (hardcoded for now, can be replaced with SQL aggregation)
      const chartData = [
        { name: "ינואר", revenue: 4000, attendance: 240 },
        { name: "פברואר", revenue: 3000, attendance: 139 },
        { name: "מרץ", revenue: monthlyRevenue || 2000, attendance: 980 },
      ];

      return {
        totalStudents: studentsRes.count || 0,
        activeClasses: classesRes.count || 0,
        monthlyRevenue,
        avgAttendance: 85,
        chartData,
      };
    } catch (error) {
      serviceLogger.error({ err: error }, "Failed to fetch admin stats");
      throw error;
    }
  },

  async getInstructorStats(instructorId: string) {
    const serviceLogger = logger.child({
      service: "DashboardService",
      method: "getInstructorStats",
    });
    serviceLogger.info({ instructorId }, "Fetching instructor stats");
    try {
      const todayDayOfWeek = new Date().getDay(); // 0-6

      // Fetch active courses for this instructor
      const coursesPromise = supabaseAdmin
        .from("classes")
        .select("*")
        .eq("instructor_id", instructorId)
        .eq("is_active", true);

      // Fetch count of unique active students enrolled in these courses
      // We use a query on enrollments joined with classes filtered by instructor
      const studentsPromise = supabaseAdmin
        .from("enrollments")
        .select("student_id, class:classes!inner(instructor_id)")
        .eq("class.instructor_id", instructorId)
        .in("status", ["ACTIVE", "PENDING"]);

      const [coursesRes, studentsRes] = await Promise.all([
        coursesPromise,
        studentsPromise,
      ]);

      if (coursesRes.error) throw coursesRes.error;
      if (studentsRes.error) throw studentsRes.error;

      const myCourses = (coursesRes.data || []) as Array<any>;

      // Calculate Total Students (Unique Count)
      // Extract unique student IDs from the enrollments list
      const uniqueStudentIds = new Set(
        (studentsRes.data || []).map((e: any) => e.student_id)
      );
      const myStudentsCount = uniqueStudentIds.size;

      // Calculate Today's Classes Count
      const todayClassesCount = myCourses.filter(
        (course) => course.day_of_week === todayDayOfWeek
      ).length;

      // Calculate Next Class (Correct Logic)
      let nextClass = null;
      if (myCourses.length > 0) {
        // Map each course to its next occurrence date
        const coursesWithNextDate = myCourses.map((course) => ({
          ...course,
          nextDate: getNextClassDate(course.day_of_week, course.start_time),
        }));

        // Sort by date (nearest first)
        coursesWithNextDate.sort(
          (a, b) => a.nextDate.getTime() - b.nextDate.getTime()
        );

        nextClass = coursesWithNextDate[0];
      }

      return {
        myCoursesCount: myCourses.length,
        myStudentsCount: myStudentsCount, // Fixed: now returns real count
        todayClassesCount: todayClassesCount,
        nextClass: nextClass,
      };
    } catch (error) {
      serviceLogger.error({ err: error }, "Failed to fetch instructor stats");
      throw error;
    }
  },
};
