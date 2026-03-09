import { prisma } from "../config/supabase";
import { logger } from "../logger";

type CourseFilters = {
  category_id?: string | number;
  [key: string]: unknown;
};

export class CourseService {
  /**
   * Get all courses with optional filters
   */
  static async getAllCourses(userRole?: string, filters: CourseFilters = {}) {
    const serviceLogger = logger.child({
      service: "CourseService",
      method: "getAllCourses",
    });
    serviceLogger.info({ userRole, filters }, "Fetching all courses");

    const where: any = {};

    // If student, only show active courses
    if (userRole === "STUDENT") {
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
  static async getAvailableForStudent(studentId: string) {
    const serviceLogger = logger.child({
      service: "CourseService",
      method: "getAvailableForStudent",
    });
    serviceLogger.info({ studentId }, "Fetching available courses for student");

    const data = await prisma.classes.findMany({
      where: { is_active: true },
      include: {
        instructor: {
          select: { full_name: true },
        },
      },
    });

    // Filter out full courses in JS
    const availableCourses = data.filter(
      (course) => (course.current_enrollment || 0) < course.max_capacity,
    );

    return availableCourses;
  }

  static async getCourseById(id: string) {
    const serviceLogger = logger.child({
      service: "CourseService",
      method: "getCourseById",
    });
    serviceLogger.info({ id }, "Fetching course by id");

    const data = await prisma.classes.findUnique({
      where: { id },
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
      throw new Error("Course not found");
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
      where: { instructor_id: instructorId },
      orderBy: { day_of_week: "asc" },
    });

    return data;
  }

  static async createCourse(courseData: Record<string, unknown>) {
    const serviceLogger = logger.child({
      service: "CourseService",
      method: "createCourse",
    });
    serviceLogger.info({ courseData }, "Creating course");

    const data = await prisma.classes.create({
      data: courseData as any,
    });

    return data;
  }

  static async updateCourse(id: string, updates: Record<string, unknown>) {
    const serviceLogger = logger.child({
      service: "CourseService",
      method: "updateCourse",
    });
    serviceLogger.info({ id, updates }, "Updating course");

    const data = await prisma.classes.update({
      where: { id },
      data: updates as any,
    });

    return data;
  }

  static async softDeleteCourse(id: string) {
    const serviceLogger = logger.child({
      service: "CourseService",
      method: "softDeleteCourse",
    });
    serviceLogger.info({ id }, "Soft deleting course");

    await prisma.classes.update({
      where: { id },
      data: { is_active: false },
    });

    serviceLogger.info({ id }, "Course deactivated");
    return true;
  }
}
