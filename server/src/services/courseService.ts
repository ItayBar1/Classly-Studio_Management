import { prisma } from "../config/prisma";
import { logger } from "../logger";
import { AppError } from "../utils/AppError";
import { checkScheduleConflict } from "../utils/conflictDetector";

type CourseFilters = {
  category_id?: string | number;
  [key: string]: unknown;
};

/**
 * Helper function to convert a time string to the ISO DateTime format required by Prisma.
 *
 * @param timeStr - The time string (e.g., "HH:MM")
 * @returns An ISO-8601 formatted string or the original string if it doesn't match the expected format.
 */
const formatTimeForPrisma = (timeStr: string) => {
  if (/^\d{2}:\d{2}$/.test(timeStr)) {
    return `1970-01-01T${timeStr}:00.000Z`;
  }
  return timeStr;
};

export class CourseService {
  /**
   * Get all courses with optional filters
   */
  static async getAllCourses(
    userRole?: string,
    filters: CourseFilters = {},
    studioId?: string
  ) {
    const serviceLogger = logger.child({
      service: "CourseService",
      method: "getAllCourses",
    });
    serviceLogger.info({ userRole, filters, studioId }, "Fetching all courses");

    // Tenant isolation: never return classes across studios. Callers without a
    // studio context (e.g. SUPER_ADMIN) have nothing tenant-scoped to list here.
    if (!studioId) {
      return [];
    }

    const where: {
      studio_id: string;
      is_active?: boolean;
      category_id?: string;
    } = { studio_id: studioId };

    // If student or filter requests active only, show active courses
    if (userRole === "STUDENT" || filters.status === "active") {
      where.is_active = true;
    }

    // Apply category filter
    if (filters.category_id) {
      where.category_id = String(filters.category_id);
    }

    const data = await prisma.classes.findMany({
      where,
      include: {
        instructor: {
          select: { full_name: true },
        },
      },
    });

    serviceLogger.info({ count: data?.length }, "Courses fetched successfully");
    return data;
  }

  /**
   * Get available courses for student (active & not fully booked)
   */
  static async getAvailableForStudent(studentId: string, studioId?: string) {
    const serviceLogger = logger.child({
      service: "CourseService",
      method: "getAvailableForStudent",
    });
    serviceLogger.info(
      { studentId, studioId },
      "Fetching available courses for student"
    );

    // Tenant isolation: a student may only browse their own studio's classes.
    if (!studioId) {
      return [];
    }

    const data = await prisma.classes.findMany({
      where: { is_active: true, studio_id: studioId },
      include: {
        instructor: {
          select: { full_name: true },
        },
      },
    });

    // Filter out full courses in JS
    const availableCourses = data.filter(
      (course) => (course.current_enrollment || 0) < course.max_capacity
    );

    return availableCourses;
  }

  static async getCourseById(id: string, studioId?: string) {
    const serviceLogger = logger.child({
      service: "CourseService",
      method: "getCourseById",
    });
    serviceLogger.info({ id, studioId }, "Fetching course by id");

    // Tenant isolation: a class outside the caller's studio must look absent.
    if (!studioId) {
      throw new AppError("Course not found", 404);
    }

    const data = await prisma.classes.findFirst({
      where: { id, studio_id: studioId },
      include: {
        instructor: {
          select: { full_name: true, profile_image_url: true },
        },
        studio: {
          select: { name: true },
        },
      },
    });

    if (!data) {
      serviceLogger.error({ id }, "Course not found");
      throw new AppError("Course not found", 404);
    }
    return data;
  }

  static async getCoursesByInstructor(instructorId: string) {
    const serviceLogger = logger.child({
      service: "CourseService",
      method: "getCoursesByInstructor",
    });
    serviceLogger.info({ instructorId }, "Fetching courses by instructor");

    const data = await prisma.classes.findMany({
      where: { instructor_id: instructorId, is_active: true },
      orderBy: { day_of_week: "asc" },
      include: {
        branch: { select: { name: true } },
        category: { select: { name: true } }
      }
    });

    return data;
  }

  static async createCourse(courseData: Record<string, unknown>) {
    const serviceLogger = logger.child({
      service: "CourseService",
      method: "createCourse",
    });
    serviceLogger.info({ courseData }, "Creating course");

    const studioId = courseData.studio_id as string;
    const branchId = courseData.branch_id as string;

    // 1. Instructor Conflict Check
    if (courseData.instructor_id) {
      const instructorClasses = await prisma.classes.findMany({
        where: {
          studio_id: studioId,
          instructor_id: courseData.instructor_id as string,
          is_active: true
        }
      });
      const instructorConflict = checkScheduleConflict(courseData as any, instructorClasses);
      if (instructorConflict.hasConflict) {
        throw new AppError("המורה כבר מלמד שיעור אחר בשעה זו", 400);
      }
      if (instructorConflict.hasWarning && !courseData.ignore_warnings) {
        throw new AppError(instructorConflict.warnings?.join("\n") || "אזהרה: המדריך משובץ בסניף אחר.", 409);
      }
    }

    // 2. Room Conflict Check
    if (courseData.location_room && branchId) {
      const roomClasses = await prisma.classes.findMany({
        where: {
          studio_id: studioId,
          branch_id: branchId,
          location_room: courseData.location_room as string,
          is_active: true
        }
      });
      const roomConflict = checkScheduleConflict(courseData as any, roomClasses);
      if (roomConflict.hasConflict) {
        throw new AppError("החדר כבר תפוס בשעה זו", 400);
      }
    }

    const { ignore_warnings, ...validCourseData } = courseData as any;

    const dataToSave = {
      ...validCourseData,
      start_time:
        typeof validCourseData.start_time === "string"
          ? formatTimeForPrisma(validCourseData.start_time)
          : validCourseData.start_time,
      end_time:
        typeof validCourseData.end_time === "string"
          ? formatTimeForPrisma(validCourseData.end_time)
          : validCourseData.end_time,
    };

    const data = await prisma.classes.create({
      data: dataToSave as any,
    });

    return data;
  }

  static async updateCourse(
    id: string,
    updates: Record<string, unknown>,
    studioId?: string
  ) {
    const serviceLogger = logger.child({
      service: "CourseService",
      method: "updateCourse",
    });
    serviceLogger.info({ id, studioId, updates }, "Updating course");

    // Tenant isolation: scope the ownership lookup so an admin can never
    // reach a class belonging to another studio. A miss is a 404.
    const existing = studioId
      ? await prisma.classes.findFirst({ where: { id, studio_id: studioId } })
      : null;
    if (!existing) {
      throw new AppError("Course not found", 404);
    }

    const proposedSession = {
      id,
      day_of_week: updates.day_of_week ?? existing.day_of_week,
      start_time: updates.start_time ?? existing.start_time,
      end_time: updates.end_time ?? existing.end_time,
      instructor_id: updates.instructor_id ?? existing.instructor_id,
      location_room: updates.location_room ?? existing.location_room,
      branch_id: updates.branch_id ?? existing.branch_id,
      studio_id: existing.studio_id
    };

    // 1. Instructor Conflict Check
    if (proposedSession.instructor_id) {
      const instructorClasses = await prisma.classes.findMany({
        where: {
          studio_id: proposedSession.studio_id,
          instructor_id: proposedSession.instructor_id as string,
          is_active: true
        }
      });
      const instructorConflict = checkScheduleConflict(proposedSession as any, instructorClasses);
      if (instructorConflict.hasConflict) {
        throw new AppError("המורה כבר מלמד שיעור אחר בשעה זו", 400);
      }
      if (instructorConflict.hasWarning && !updates.ignore_warnings) {
        throw new AppError(instructorConflict.warnings?.join("\n") || "אזהרה: המדריך משובץ בסניף אחר.", 409);
      }
    }

    // 2. Room Conflict Check
    if (proposedSession.location_room && proposedSession.branch_id) {
      const roomClasses = await prisma.classes.findMany({
        where: {
          studio_id: proposedSession.studio_id,
          branch_id: proposedSession.branch_id as string,
          location_room: proposedSession.location_room as string,
          is_active: true
        }
      });
      const roomConflict = checkScheduleConflict(proposedSession as any, roomClasses);
      if (roomConflict.hasConflict) {
        throw new AppError("החדר כבר תפוס בשעה זו", 400);
      }
    }

    const { ignore_warnings, ...validUpdates } = updates as any;

    const dataToUpdate = {
      ...validUpdates,
      start_time:
        typeof validUpdates.start_time === "string"
          ? formatTimeForPrisma(validUpdates.start_time)
          : validUpdates.start_time,
      end_time:
        typeof validUpdates.end_time === "string"
          ? formatTimeForPrisma(validUpdates.end_time)
          : validUpdates.end_time,
    };

    const data = await prisma.classes.update({
      where: { id },
      data: dataToUpdate as any,
    });

    return data;
  }

  static async softDeleteCourse(id: string, studioId?: string) {
    const serviceLogger = logger.child({
      service: "CourseService",
      method: "softDeleteCourse",
    });
    serviceLogger.info({ id, studioId }, "Soft deleting course");

    // Tenant isolation: confirm the class is ours before deactivating it.
    const existing = studioId
      ? await prisma.classes.findFirst({
          where: { id, studio_id: studioId },
          select: { id: true },
        })
      : null;
    if (!existing) {
      throw new AppError("Course not found", 404);
    }

    await prisma.classes.update({
      where: { id },
      data: { is_active: false },
    });

    serviceLogger.info({ id }, "Course deactivated");
    return true;
  }
}
