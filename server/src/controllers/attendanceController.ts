import { Request, Response, NextFunction } from "express";
import { AttendanceService, AttendanceFilters } from "../services/attendanceService";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";

export class AttendanceController {
  // Record attendance (create or update) — instructor (own class) or admin (own studio)
  static async recordAttendance(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const requestLog = req.logger!;
    requestLog.info({ body: req.body, userId: req.user!.id }, "Controller entry");
    try {
      const userId = req.user!.id;
      const { classId, date, records, sessionStatus } = req.body;

      if (!classId || !date || !Array.isArray(records)) {
        throw new AppError(
          "Missing required fields: classId, date, or records array",
          400
        );
      }

      await AttendanceController.assertClassAccess(req, classId);

      const result = await AttendanceService.recordAttendance(
        classId,
        date,
        userId,
        records,
        sessionStatus
      );
      requestLog.info({ count: result.length }, "Attendance recorded successfully");
      res.json({
        message: "Attendance recorded successfully",
        count: result.length,
      });
    } catch (error: any) {
      requestLog.error({ err: error }, "Error recording attendance");
      next(error);
    }
  }

  // Get attendance history for a specific class
  static async getClassAttendance(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const requestLog = req.logger!;
    requestLog.info(
      { params: req.params, query: req.query, userId: req.user!.id },
      "Controller entry"
    );
    try {
      const { classId } = req.params;
      const { date } = req.query;

      await AttendanceController.assertClassAccess(req, classId);

      const data = await AttendanceService.getClassAttendance(
        classId,
        date as string
      );
      requestLog.info({ classId, count: data?.length }, "Class attendance fetched");
      res.json(data);
    } catch (error: any) {
      requestLog.error({ err: error }, "Error fetching class attendance");
      next(error);
    }
  }

  // Get attendance history for the authenticated student
  static async getStudentHistory(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const requestLog = req.logger!;
    requestLog.info({ userId: req.user!.id }, "Controller entry");
    try {
      const history = await AttendanceService.getStudentHistory(req.user!.id);
      requestLog.info({ count: history?.length }, "Student attendance history fetched");
      res.json(history);
    } catch (error: any) {
      requestLog.error({ err: error }, "Error fetching student attendance history");
      next(error);
    }
  }

  // Get sessions requiring attendance for the logged-in instructor
  static async getInstructorSessions(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const requestLog = req.logger!;
    requestLog.info({ userId: req.user!.id, query: req.query }, "Controller entry");
    try {
      const { from, to } = req.query as { from?: string; to?: string };
      const sessions = await AttendanceService.getInstructorSessions(req.user!.id, {
        from,
        to,
      });
      requestLog.info({ count: sessions?.length }, "Instructor sessions fetched");
      res.json(sessions);
    } catch (error: any) {
      requestLog.error({ err: error }, "Error fetching instructor sessions");
      next(error);
    }
  }

  /**
   * Manager attendance overview (studio-wide).
   * Returns `{ mode: 'session' | 'student', items }`. When a `studentId` filter
   * is supplied the response switches to a student-centric list; otherwise it is
   * the recurring-session overview, grouped on the client by branch → instructor.
   */
  static async getStudioOverview(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const requestLog = req.logger!;
    requestLog.info({ query: req.query, userId: req.user!.id }, "Controller entry");
    try {
      const studioId = req.studioId!;
      const { studentId } = req.query as { studentId?: string };
      const filters = AttendanceController.parseFilters(req);

      if (studentId) {
        const items = await AttendanceService.getStudentAttendanceOverview(
          studioId,
          studentId,
          filters
        );
        requestLog.info({ count: items.length }, "Student overview fetched");
        return res.json({ mode: "student", items });
      }

      const items = await AttendanceService.getStudioSessions(studioId, filters);
      requestLog.info({ count: items.length }, "Studio sessions fetched");
      res.json({ mode: "session", items });
    } catch (error: any) {
      requestLog.error({ err: error }, "Error fetching studio attendance overview");
      next(error);
    }
  }

  // ----- helpers -----

  private static parseFilters(req: Request): AttendanceFilters {
    const { instructorId, branchId, classId, roomId, from, to } =
      req.query as Record<string, string | undefined>;
    const filters: AttendanceFilters = {};
    if (instructorId) filters.instructorId = instructorId;
    if (branchId) filters.branchId = branchId;
    if (classId) filters.classId = classId;
    if (roomId) filters.roomId = roomId;
    if (from) filters.from = from;
    if (to) filters.to = to;
    return filters;
  }

  /**
   * Ensure the acting user may touch this class:
   *  - INSTRUCTOR: must be the class's instructor.
   *  - ADMIN: the class must belong to the admin's studio (tenant isolation).
   */
  private static async assertClassAccess(req: Request, classId: string) {
    const cls = await prisma.classes.findUnique({
      where: { id: classId },
      select: { instructor_id: true, studio_id: true },
    });
    if (!cls) throw new AppError("Class not found", 404);

    const role = req.user!.role;
    if (role === "ADMIN" || role === "SUPER_ADMIN") {
      if (cls.studio_id !== req.studioId) {
        throw new AppError("Class not found", 404);
      }
      return;
    }
    if (cls.instructor_id !== req.user!.id) {
      throw new AppError("You are not the instructor of this class", 403);
    }
  }
}
