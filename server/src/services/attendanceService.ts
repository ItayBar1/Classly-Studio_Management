import { prisma } from "../config/supabase";
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
  ) {
    const serviceLogger = logger.child({
      service: "AttendanceService",
      method: "recordAttendance",
    });
    serviceLogger.info(
      { classId, date, instructorId, recordCount: records.length },
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

    // Create a map for quick lookups: studentId -> enrollmentId
    const enrollmentMap = new Map<string, string>(
      enrollments.map(({ student_id, id }) => [student_id, id]),
    );

    // Preliminary step: fetch studio_id
    const classData = await prisma.classes.findUnique({
      where: { id: classId },
      select: { studio_id: true },
    });

    if (!classData) {
      throw new Error("Class not found");
    }

    // 2. Prepare upsert operations
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

      const result = await prisma.attendance.upsert({
        where: {
          enrollment_id_session_date: {
            enrollment_id: enrollmentId,
            session_date: new Date(date),
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
          session_date: new Date(date),
          status: record.status,
          notes: record.notes,
          recorded_by: instructorId,
          recorded_at: new Date(),
        },
      });
      results.push(result);
    }

    return results;
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
}
