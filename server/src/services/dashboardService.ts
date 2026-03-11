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

      const [totalStudents, activeClasses, payments] = await Promise.all([
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
      ]);

      const monthlyRevenue = payments.reduce(
        (sum, payment) => sum + Number(payment.amount_ils),
        0,
      );

      const chartData = [
        { name: "ינואר", revenue: 4000, attendance: 240 },
        { name: "פברואר", revenue: 3000, attendance: 139 },
        { name: "מרץ", revenue: monthlyRevenue || 2000, attendance: 980 },
      ];

      return {
        totalStudents,
        activeClasses,
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
