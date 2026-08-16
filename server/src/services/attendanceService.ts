import { prisma } from "../config/prisma";
import { logger } from "../logger";
import { AppError } from "../utils/AppError";

interface AttendanceRecord {
  studentId: string;
  status: "PRESENT" | "ABSENT" | "EXCUSED" | "LATE";
  notes?: string;
}

/** Optional filters shared by the attendance views. `from`/`to` are YYYY-MM-DD. */
export interface AttendanceFilters {
  instructorId?: string;
  branchId?: string;
  classId?: string;
  roomId?: string;
  from?: string;
  to?: string;
}

/** A single class occurrence on a given date, with its reporting status. */
interface SessionOccurrence {
  classId: string;
  className: string;
  branchId: string | null;
  branchName: string;
  instructorId: string | null;
  instructorName: string;
  roomName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  status: string; // COMPLETED | IN_PROGRESS | MISSING
}

/** Class shape required to expand recurring occurrences. */
interface ExpandableClass {
  id: string;
  name: string;
  day_of_week: number | null;
  start_time: Date;
  end_time: Date;
  location_room: string | null;
  branch: { id: string; name: string } | null;
  instructor: { id: string; full_name: string | null } | null;
}

const CLASS_OCCURRENCE_SELECT = {
  id: true,
  name: true,
  day_of_week: true,
  start_time: true,
  end_time: true,
  location_room: true,
  branch: { select: { id: true, name: true } },
  instructor: { select: { id: true, full_name: true } },
} as const;

export class AttendanceService {
  /** Lookback window (days) for the sessions/overview screens. */
  private static readonly LOOKBACK_DAYS = 30;

  /**
   * Record attendance (Upsert).
   * `recordedBy` is the acting user (instructor or admin). The attendance row's
   * `instructor_id` is always the class's real instructor, so an admin editing
   * attendance does not steal ownership of the records.
   */
  static async recordAttendance(
    classId: string,
    date: string,
    recordedBy: string,
    records: AttendanceRecord[],
    sessionStatus: "IN_PROGRESS" | "COMPLETED" = "COMPLETED"
  ) {
    const serviceLogger = logger.child({
      service: "AttendanceService",
      method: "recordAttendance",
    });
    serviceLogger.info(
      { classId, date, recordedBy, recordCount: records.length, sessionStatus },
      "Recording attendance"
    );

    const classData = await prisma.classes.findUnique({
      where: { id: classId },
      select: {
        studio_id: true,
        instructor_id: true,
        start_time: true,
        end_time: true,
        location_room: true,
        max_capacity: true,
      },
    });

    if (!classData) {
      throw new AppError("Class not found", 404);
    }

    // Resolve enrollment_id per student (required by the attendance unique key).
    const studentIds = records.map((r) => r.studentId);
    const enrollments = await prisma.enrollments.findMany({
      where: { class_id: classId, student_id: { in: studentIds } },
      select: { id: true, student_id: true },
    });
    const enrollmentMap = new Map<string, string>(
      enrollments.map(({ student_id, id }) => [student_id, id])
    );

    const sessionDate = new Date(date);

    return await prisma.$transaction(async (tx) => {
      const results: any[] = [];
      for (const record of records) {
        const enrollmentId = enrollmentMap.get(record.studentId);
        if (!enrollmentId) {
          serviceLogger.warn(
            { studentId: record.studentId, classId },
            "Skipping attendance: enrollment not found"
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
            recorded_by: recordedBy,
          },
          create: {
            studio_id: classData.studio_id,
            class_id: classId,
            instructor_id: classData.instructor_id,
            enrollment_id: enrollmentId,
            student_id: record.studentId,
            session_date: sessionDate,
            status: record.status,
            notes: record.notes,
            recorded_by: recordedBy,
            recorded_at: new Date(),
          },
        });
        results.push(result);
      }

      // Track the session's reporting status (create or update).
      const existingSession = await tx.schedule_sessions.findFirst({
        where: { class_id: classId, session_date: sessionDate },
      });

      if (existingSession) {
        await tx.schedule_sessions.update({
          where: { id: existingSession.id },
          data: { status: sessionStatus },
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
            status: sessionStatus,
          },
        });
      }

      return results;
    });
  }

  /**
   * Get attendance for a specific class (optionally on a single date).
   */
  static async getClassAttendance(classId: string, date?: string) {
    const serviceLogger = logger.child({
      service: "AttendanceService",
      method: "getClassAttendance",
    });
    serviceLogger.info({ classId, date }, "Fetching class attendance");

    const where: any = { class_id: classId };
    if (date) where.session_date = new Date(date);

    const data = await prisma.attendance.findMany({
      where,
      include: {
        student: { select: { full_name: true, profile_image_url: true } },
      },
      orderBy: { session_date: "desc" },
    });

    serviceLogger.info({ count: data?.length }, "Class attendance fetched");
    return data;
  }

  /**
   * Get attendance history for a student (used by the student's own view).
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
        class: { select: { name: true, start_time: true, end_time: true } },
      },
      orderBy: { session_date: "desc" },
    });

    serviceLogger.info(
      { count: data?.length },
      "Student attendance history fetched"
    );
    return data;
  }

  /**
   * Sessions for an instructor (their own classes) within the resolved window.
   */
  static async getInstructorSessions(
    instructorId: string,
    range: { from?: string; to?: string } = {}
  ): Promise<SessionOccurrence[]> {
    const { from, to } = this.resolveWindow(range.from, range.to);

    const classes = (await prisma.classes.findMany({
      where: { instructor_id: instructorId, is_active: true },
      select: CLASS_OCCURRENCE_SELECT,
    })) as ExpandableClass[];

    const statusMap = await this.fetchSessionStatusMap(
      { class: { instructor_id: instructorId } },
      from,
      to
    );

    return this.buildSessionOccurrences(classes, statusMap, from, to);
  }

  /**
   * Past + today sessions across the whole studio, with optional filters.
   * Powers the manager's attendance overview (grouped by branch → instructor).
   */
  static async getStudioSessions(
    studioId: string,
    filters: AttendanceFilters = {}
  ): Promise<SessionOccurrence[]> {
    const serviceLogger = logger.child({
      service: "AttendanceService",
      method: "getStudioSessions",
    });
    serviceLogger.info({ studioId, filters }, "Fetching studio sessions");

    const { from, to } = this.resolveWindow(filters.from, filters.to);

    const where: any = { studio_id: studioId, is_active: true };
    if (filters.instructorId) where.instructor_id = filters.instructorId;
    if (filters.branchId) where.branch_id = filters.branchId;
    if (filters.classId) where.id = filters.classId;
    if (filters.roomId) where.room_id = filters.roomId;

    const classes = (await prisma.classes.findMany({
      where,
      select: CLASS_OCCURRENCE_SELECT,
    })) as ExpandableClass[];

    const statusMap = await this.fetchSessionStatusMap(
      { studio_id: studioId },
      from,
      to
    );

    return this.buildSessionOccurrences(classes, statusMap, from, to);
  }

  /**
   * A specific student's attendance across the studio (student-centric list),
   * with optional filters. Each row carries that student's own status so the
   * manager can see exactly which classes they attended / were late / missed.
   */
  static async getStudentAttendanceOverview(
    studioId: string,
    studentId: string,
    filters: AttendanceFilters = {}
  ) {
    const serviceLogger = logger.child({
      service: "AttendanceService",
      method: "getStudentAttendanceOverview",
    });
    serviceLogger.info(
      { studioId, studentId, filters },
      "Fetching student attendance overview"
    );

    const classWhere: any = {};
    if (filters.instructorId) classWhere.instructor_id = filters.instructorId;
    if (filters.branchId) classWhere.branch_id = filters.branchId;
    if (filters.roomId) classWhere.room_id = filters.roomId;

    const where: any = { studio_id: studioId, student_id: studentId };
    if (filters.classId) where.class_id = filters.classId;
    if (Object.keys(classWhere).length > 0) where.class = classWhere;

    if (filters.from || filters.to) {
      const { from, to } = this.resolveWindow(filters.from, filters.to);
      where.session_date = { gte: from, lte: to };
    }

    const rows = await prisma.attendance.findMany({
      where,
      select: {
        session_date: true,
        status: true,
        notes: true,
        class: {
          select: {
            id: true,
            name: true,
            start_time: true,
            end_time: true,
            location_room: true,
            branch: { select: { id: true, name: true } },
            instructor: { select: { id: true, full_name: true } },
          },
        },
      },
      orderBy: { session_date: "desc" },
    });

    return rows.map((r) => ({
      classId: r.class.id,
      className: r.class.name,
      branchId: r.class.branch?.id ?? null,
      branchName: r.class.branch?.name || "סניף ראשי",
      instructorId: r.class.instructor?.id ?? null,
      instructorName: r.class.instructor?.full_name || "מדריך",
      roomName: r.class.location_room || "לא צוין",
      date: this.toDateStr(r.session_date),
      startTime: this.toTimeStr(r.class.start_time),
      endTime: this.toTimeStr(r.class.end_time),
      studentStatus: r.status,
      notes: r.notes,
    }));
  }

  // ----- internal helpers -----

  /**
   * Resolve the date window. With no input it defaults to the last
   * LOOKBACK_DAYS ending now; otherwise it honours the given range
   * (start-of-day → end-of-day).
   */
  private static resolveWindow(fromStr?: string, toStr?: string) {
    const to = toStr ? new Date(`${toStr}T23:59:59.999Z`) : new Date();
    let from: Date;
    if (fromStr) {
      from = new Date(`${fromStr}T00:00:00.000Z`);
    } else {
      from = new Date(to);
      from.setDate(from.getDate() - this.LOOKBACK_DAYS);
      from.setHours(0, 0, 0, 0);
    }
    return { from, to };
  }

  private static toDateStr(d: Date): string {
    return d.toISOString().split("T")[0];
  }

  private static toTimeStr(d: Date): string {
    return d.toISOString().slice(11, 16);
  }

  /**
   * Build a "classId_YYYY-MM-DD" -> status map from schedule_sessions.
   * `scopeWhere` narrows to a studio or a single instructor's classes.
   */
  private static async fetchSessionStatusMap(
    scopeWhere: any,
    from: Date,
    to: Date
  ): Promise<Map<string, string>> {
    const sessions = await prisma.schedule_sessions.findMany({
      where: { ...scopeWhere, session_date: { gte: from, lte: to } },
      select: { class_id: true, session_date: true, status: true },
    });

    const map = new Map<string, string>();
    for (const s of sessions) {
      const key = `${s.class_id}_${this.toDateStr(s.session_date)}`;
      map.set(key, s.status || "SCHEDULED");
    }
    return map;
  }

  /**
   * Expand recurring classes into their past/today occurrences and merge the
   * recorded reporting status. Shared by instructor and studio session views.
   */
  private static buildSessionOccurrences(
    classes: ExpandableClass[],
    statusMap: Map<string, string>,
    from: Date,
    to: Date
  ): SessionOccurrence[] {
    const sessions: SessionOccurrence[] = [];

    for (const cls of classes) {
      if (cls.day_of_week === null || cls.day_of_week === undefined) continue;

      const cursor = new Date(from);
      while (cursor <= to) {
        if (cursor.getDay() === cls.day_of_week) {
          const dateStr = this.toDateStr(cursor);
          const status = statusMap.get(`${cls.id}_${dateStr}`) || "MISSING";

          sessions.push({
            classId: cls.id,
            className: cls.name,
            branchId: cls.branch?.id ?? null,
            branchName: cls.branch?.name || "סניף ראשי",
            instructorId: cls.instructor?.id ?? null,
            instructorName: cls.instructor?.full_name || "מדריך",
            roomName: cls.location_room || "לא צוין",
            date: dateStr,
            startTime: this.toTimeStr(cls.start_time),
            endTime: this.toTimeStr(cls.end_time),
            status,
          });
        }
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    sessions.sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return b.startTime.localeCompare(a.startTime);
    });

    return sessions;
  }
}
