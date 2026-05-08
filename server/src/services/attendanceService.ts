import { prisma } from "../config/prisma";
import { logger } from "../logger";

interface AttendanceRecord {
  studentId: string;
  status: "PRESENT" | "ABSENT" | "EXCUSED" | "LATE";
  notes?: string;
}

export class AttendanceService {
  /**
   * Record attendance (Upsert).
   * Automatically fetches enrollment_id for each student to satisfy DB constraints.
   */
  static async recordAttendance(
    classId: string,
    date: string,
    instructorId: string,
    records: AttendanceRecord[],
    sessionStatus: "IN_PROGRESS" | "COMPLETED" = "COMPLETED"
  ) {
    const serviceLogger = logger.child({
      service: "AttendanceService",
      method: "recordAttendance",
    });
    serviceLogger.info(
      { classId, date, instructorId, recordCount: records.length, sessionStatus },
      "Recording attendance",
    );

    // 1. Fetch enrollment_id values for the students in this class
    const studentIds = records.map((r) => r.studentId);

    const enrollments = await prisma.enrollments.findMany({
      where: {
        class_id: classId,
        student_id: { in: studentIds },
      },
      select: { id: true, student_id: true },
    });

    const enrollmentMap = new Map<string, string>(
      enrollments.map(({ student_id, id }) => [student_id, id]),
    );

    const classData = await prisma.classes.findUnique({
      where: { id: classId },
      select: { studio_id: true, start_time: true, end_time: true, location_room: true, max_capacity: true },
    });

    if (!classData) {
      throw new Error("Class not found");
    }

    const sessionDate = new Date(date);

    // 2. Perform all updates within a transaction
    return await prisma.$transaction(async (tx) => {
      const results: any[] = [];
      for (const record of records) {
        const enrollmentId = enrollmentMap.get(record.studentId);

        if (!enrollmentId) {
          serviceLogger.warn(
            { studentId: record.studentId, classId },
            "Skipping attendance: enrollment not found",
          );
          continue;
        }

        const result = await tx.attendance.upsert({
          where: {
            enrollment_id_session_date: {
              enrollment_id: enrollmentId,
              session_date: sessionDate,
            },
          },
          update: {
            status: record.status,
            notes: record.notes,
            recorded_at: new Date(),
            recorded_by: instructorId,
          },
          create: {
            studio_id: classData.studio_id,
            class_id: classId,
            instructor_id: instructorId,
            enrollment_id: enrollmentId,
            student_id: record.studentId,
            session_date: sessionDate,
            status: record.status,
            notes: record.notes,
            recorded_by: instructorId,
            recorded_at: new Date(),
          },
        });
        results.push(result);
      }

      // 3. Update or create schedule_sessions
      const existingSession = await tx.schedule_sessions.findFirst({
        where: {
          class_id: classId,
          session_date: sessionDate,
        }
      });

      if (existingSession) {
        await tx.schedule_sessions.update({
          where: { id: existingSession.id },
          data: { status: sessionStatus }
        });
      } else {
        await tx.schedule_sessions.create({
          data: {
            studio_id: classData.studio_id,
            class_id: classId,
            session_date: sessionDate,
            start_time: classData.start_time,
            end_time: classData.end_time,
            location_room: classData.location_room,
            capacity: classData.max_capacity,
            status: sessionStatus
          }
        });
      }

      return results;
    });
  }

  /**
   * Get attendance for a specific class
   */
  static async getClassAttendance(classId: string, date?: string) {
    const serviceLogger = logger.child({
      service: "AttendanceService",
      method: "getClassAttendance",
    });
    serviceLogger.info({ classId, date }, "Fetching class attendance");

    const where: any = { class_id: classId };
    if (date) {
      where.session_date = new Date(date);
    }

    const data = await prisma.attendance.findMany({
      where,
      include: {
        student: {
          select: { full_name: true, profile_image_url: true },
        },
      },
      orderBy: { session_date: "desc" },
    });

    serviceLogger.info({ count: data?.length }, "Class attendance fetched");
    return data;
  }

  /**
   * Get attendance history for a student
   */
  static async getStudentHistory(studentId: string) {
    const serviceLogger = logger.child({
      service: "AttendanceService",
      method: "getStudentHistory",
    });
    serviceLogger.info({ studentId }, "Fetching student attendance history");

    const data = await prisma.attendance.findMany({
      where: { student_id: studentId },
      select: {
        session_date: true,
        status: true,
        notes: true,
        class: {
          select: { name: true, start_time: true, end_time: true },
        },
      },
      orderBy: { session_date: "desc" },
    });

    serviceLogger.info(
      { count: data?.length },
      "Student attendance history fetched",
    );
    return data;
  }

  /**
   * Get past and today's sessions for an instructor (up to 30 days ago)
   * Calculates recurring dates and merges with schedule_sessions status.
   */
  static async getInstructorSessions(instructorId: string) {
    const serviceLogger = logger.child({
      service: "AttendanceService",
      method: "getInstructorSessions",
    });
    serviceLogger.info({ instructorId }, "Fetching instructor sessions");

    // 1. Fetch instructor's active classes
    const classes = await prisma.classes.findMany({
      where: { instructor_id: instructorId, is_active: true },
      select: { id: true, name: true, day_of_week: true, start_time: true, end_time: true, location_room: true, branch: { select: { name: true } } }
    });

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    // 2. Fetch schedule_sessions for the instructor
    const scheduleSessions = await prisma.schedule_sessions.findMany({
      where: {
        class: { instructor_id: instructorId },
        session_date: { gte: thirtyDaysAgo, lte: now }
      }
    });

    // Create a map for quick lookup: "classId_YYYY-MM-DD" -> status
    const sessionStatusMap = new Map<string, string>();
    for (const session of scheduleSessions) {
      const dateStr = session.session_date.toISOString().split('T')[0];
      sessionStatusMap.set(`${session.class_id}_${dateStr}`, session.status || "SCHEDULED");
    }

    // 3. Generate past and today occurrences
    const sessions: any[] = [];
    
    for (const cls of classes) {
      if (cls.day_of_week === null || cls.day_of_week === undefined) continue;

      let currentDate = new Date(thirtyDaysAgo);
      while (currentDate <= now) {
        if (currentDate.getDay() === cls.day_of_week) {
          const dateStr = currentDate.toISOString().split('T')[0];
          const status = sessionStatusMap.get(`${cls.id}_${dateStr}`) || "MISSING";
          
          sessions.push({
            classId: cls.id,
            className: cls.name,
            branchName: cls.branch?.name || "סניף",
            roomName: cls.location_room || "לא צוין",
            date: dateStr,
            startTime: cls.start_time.toISOString().slice(11, 16),
            endTime: cls.end_time.toISOString().slice(11, 16),
            status
          });
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // Sort descending by date, then time
    sessions.sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return b.startTime.localeCompare(a.startTime);
    });

    return sessions;
  }
}
