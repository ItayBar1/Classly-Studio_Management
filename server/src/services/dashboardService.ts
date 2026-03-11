import { prisma } from "../config/prisma";
import { logger } from "../logger";

// Helper to calculate next occurrence date of a class
const getNextClassDate = (dayOfWeek: number, startTime: string): Date => {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday
  const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(startTime.trim());
  if (!timeMatch) {
    throw new Error(
      `Invalid startTime format (expected HH:MM): "${startTime}"`,
    );
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

  if (daysUntil === 0) {
    const classTime = new Date(now);
    classTime.setHours(hours, minutes, 0, 0);
    if (classTime <= now) {
      daysUntil = 7;
    }
  } else if (daysUntil < 0) {
    daysUntil += 7;
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
      const startOfMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1,
      );

      // Last 7 days range
      const now = new Date();
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const [totalStudents, activeClasses, payments, recentPayments, recentAttendance] = await Promise.all([
        prisma.users.count({
          where: { role: "STUDENT", studio_id: studioId },
        }),
        prisma.classes.count({
          where: { is_active: true, studio_id: studioId },
        }),
        prisma.payments.findMany({
          where: {
            status: { in: ["COMPLETED", "SUCCEEDED"] },
            studio_id: studioId,
            created_at: { gte: startOfMonth },
          },
          select: { amount_ils: true },
        }),
        // Payments for the last 7 days (for chart)
        prisma.payments.findMany({
          where: {
            status: { in: ["COMPLETED", "SUCCEEDED"] },
            studio_id: studioId,
            created_at: { gte: sevenDaysAgo },
          },
          select: { amount_ils: true, created_at: true },
        }),
        // Attendance for the last 7 days (for chart)
        prisma.attendance.findMany({
          where: {
            studio_id: studioId,
            session_date: { gte: sevenDaysAgo },
          },
          select: { session_date: true, status: true },
        }),
      ]);

      const monthlyRevenue = payments.reduce(
        (sum, payment) => sum + Number(payment.amount_ils),
        0,
      );

      // Hebrew day names indexed by JS getDay() (0=Sunday)
      const DAY_NAMES_HE: Record<number, string> = {
        0: "א׳", 1: "ב׳", 2: "ג׳", 3: "ד׳", 4: "ה׳", 5: "ו׳", 6: "ש׳",
      };

      // Build chart data for the last 7 days
      const chartData: Array<{ name: string; revenue: number; attendance: number }> = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayStart.getDate() + 1);

        const dayRevenue = recentPayments
          .filter(p => {
            const pDate = p.created_at ? new Date(p.created_at) : null;
            return pDate && pDate >= dayStart && pDate < dayEnd;
          })
          .reduce((sum, p) => sum + Number(p.amount_ils), 0);

        const dayAttendance = recentAttendance
          .filter(a => {
            const aDate = new Date(a.session_date);
            return aDate >= dayStart && aDate < dayEnd && a.status === "PRESENT";
          }).length;

        chartData.push({
          name: DAY_NAMES_HE[dayStart.getDay()] || dayStart.toLocaleDateString("he-IL", { weekday: "short" }),
          revenue: dayRevenue,
          attendance: dayAttendance,
        });
      }

      // Average daily attendance over the last 7 days
      const totalPresent = recentAttendance.filter(a => a.status === "PRESENT").length;
      const avgAttendance = Math.round(totalPresent / 7);

      return {
        totalStudents,
        activeClasses,
        monthlyRevenue,
        avgAttendance,
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
      const todayDayOfWeek = new Date().getDay();

      const [myCourses, studentEnrollments] = await Promise.all([
        prisma.classes.findMany({
          where: {
            instructor_id: instructorId,
            is_active: true,
          },
        }),
        prisma.enrollments.findMany({
          where: {
            status: { in: ["ACTIVE", "PENDING"] },
            class: { instructor_id: instructorId },
          },
          select: { student_id: true },
        }),
      ]);

      // Calculate Total Students (Unique Count)
      const uniqueStudentIds = new Set(
        studentEnrollments.map((e) => e.student_id),
      );
      const myStudentsCount = uniqueStudentIds.size;

      // Calculate Today's Classes Count
      const todayClassesCount = myCourses.filter(
        (course) => course.day_of_week === todayDayOfWeek,
      ).length;

      // Calculate Next Class
      let nextClass: any = null;
      if (myCourses.length > 0) {
        const coursesWithNextDate = myCourses.map((course) => ({
          ...course,
          // Prisma returns Time as Date object, extract HH:MM string
          nextDate: getNextClassDate(
            course.day_of_week!,
            course.start_time.toISOString().slice(11, 16),
          ),
        }));

        coursesWithNextDate.sort(
          (a, b) => a.nextDate.getTime() - b.nextDate.getTime(),
        );

        nextClass = coursesWithNextDate[0];
      }

      return {
        myCoursesCount: myCourses.length,
        myStudentsCount,
        todayClassesCount,
        nextClass,
      };
    } catch (error) {
      serviceLogger.error({ err: error }, "Failed to fetch instructor stats");
      throw error;
    }
  },
};
