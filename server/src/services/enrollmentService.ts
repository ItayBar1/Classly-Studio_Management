import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { logger } from "../logger";
import { AppError } from "../utils/AppError";

export class EnrollmentService {
  /**
   * Lightweight course info lookup for pre-flight validation.
   */
  static async getCourseInfo(classId: string, studioId?: string) {
    // Tenant isolation: never price a class from another studio.
    const course = studioId
      ? await prisma.classes.findFirst({
          where: { id: classId, studio_id: studioId },
          select: { name: true, price_ils: true },
        })
      : null;
    if (!course) throw new AppError("Course not found", 404);
    return { name: course.name, price: course.price_ils };
  }

  /**
   * Enroll a student to a class.
   */
  static async enrollStudent(
    studioId: string,
    studentId: string,
    classId: string,
    status: "ACTIVE" | "PENDING" = "ACTIVE",
    paymentStatus: "PAID" | "PENDING" | "OVERDUE" = "PAID",
    notes?: string,
    tx?: Prisma.TransactionClient
  ) {
    const serviceLogger = logger.child({
      service: "EnrollmentService",
      method: "enrollStudent",
    });
    serviceLogger.info(
      { studioId, studentId, classId, status, paymentStatus },
      "Enrolling student to class"
    );

    const db = tx ?? prisma;

    // 1. Fetch course details (capacity and pricing), scoped to the studio so
    //    an admin cannot enroll anyone into another tenant's class.
    const course = await db.classes.findFirst({
      where: { id: classId, studio_id: studioId },
      select: {
        max_capacity: true,
        current_enrollment: true,
        price_ils: true,
        start_time: true,
        name: true,
      },
    });

    if (!course) {
      serviceLogger.error({ classId }, "Course not found during enrollment");
      throw new AppError("Course not found", 404);
    }

    // 1b. The student must belong to the same studio as the class.
    const student = await db.users.findFirst({
      where: { id: studentId, studio_id: studioId, role: "STUDENT" },
      select: { id: true },
    });

    if (!student) {
      serviceLogger.error({ studentId }, "Student not found during enrollment");
      throw new AppError("Student not found", 404);
    }

    // 2. Validate capacity
    if ((course.current_enrollment || 0) >= course.max_capacity) {
      serviceLogger.warn({ classId }, "Course is full");
      throw new AppError("Course is full", 409);
    }

    // 3. Prevent duplicate enrollment
    const existing = await db.enrollments.findFirst({
      where: {
        student_id: studentId,
        class_id: classId,
        status: { not: "CANCELLED" },
      },
      select: { id: true },
    });

    if (existing) {
      serviceLogger.warn(
        { studentId, classId },
        "Student already enrolled in course"
      );
      throw new AppError("Student is already enrolled in this course", 409);
    }

    // --- FREE COURSE LOGIC ---
    const priceIls = Number(course.price_ils);
    const isFree = priceIls === 0 || course.price_ils === null;
    const finalStatus = isFree ? "ACTIVE" : status;
    const finalPaymentStatus = isFree ? "PAID" : paymentStatus;

    // 4. Create enrollment
    const enrollment = await db.enrollments.create({
      data: {
        studio_id: studioId,
        student_id: studentId,
        class_id: classId,
        status: finalStatus,
        payment_status: finalPaymentStatus,
        start_date: new Date(),
        total_amount_due: course.price_ils,
        notes: notes,
      },
    });

    return {
      enrollment,
      courseDetails: {
        price: course.price_ils,
        name: course.name,
      },
    };
  }

  /**
   * Get enrollments for a specific student
   */
  static async getStudentEnrollments(studentId: string, studioId?: string) {
    const serviceLogger = logger.child({
      service: "EnrollmentService",
      method: "getStudentEnrollments",
    });
    serviceLogger.info({ studentId, studioId }, "Fetching student enrollments");

    // Tenant isolation: never surface another studio's enrollments.
    if (!studioId) {
      return [];
    }

    const data = await prisma.enrollments.findMany({
      where: {
        student_id: studentId,
        studio_id: studioId,
        status: { not: "CANCELLED" },
      },
      include: {
        class: {
          include: {
            instructor: {
              select: { full_name: true, profile_image_url: true },
            },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return data;
  }

  /**
   * Get enrollments for a specific class (Student roster)
   */
  static async getClassEnrollments(classId: string, studioId?: string) {
    const serviceLogger = logger.child({
      service: "EnrollmentService",
      method: "getClassEnrollments",
    });
    serviceLogger.info({ classId, studioId }, "Fetching class enrollments");

    // Tenant isolation: never surface another studio's roster.
    if (!studioId) {
      return [];
    }

    const data = await prisma.enrollments.findMany({
      where: {
        class_id: classId,
        studio_id: studioId,
        status: { not: "CANCELLED" },
      },
      select: {
        id: true,
        status: true,
        payment_status: true,
        student: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone_number: true,
            profile_image_url: true,
          },
        },
      },
      orderBy: { created_at: "asc" },
    });

    return data;
  }

  /**
   * Cancel enrollment
   */
  static async cancelEnrollment(enrollmentId: string, studioId?: string) {
    const serviceLogger = logger.child({
      service: "EnrollmentService",
      method: "cancelEnrollment",
    });
    serviceLogger.info({ enrollmentId, studioId }, "Cancelling enrollment");

    // Tenant isolation: an enrollment outside the caller's studio is a 404.
    const enrollment = studioId
      ? await prisma.enrollments.findFirst({
          where: { id: enrollmentId, studio_id: studioId },
          select: { class_id: true, status: true },
        })
      : null;

    if (!enrollment) {
      serviceLogger.warn({ enrollmentId }, "Enrollment not found");
      throw new AppError("Enrollment not found", 404);
    }

    await prisma.enrollments.update({
      where: { id: enrollmentId },
      data: { status: "CANCELLED" },
    });
  }

  /**
   * Helper to verify if instructor owns the class
   */
  static async verifyInstructorClass(
    instructorId: string,
    classId: string
  ): Promise<boolean> {
    const serviceLogger = logger.child({
      service: "EnrollmentService",
      method: "verifyInstructorClass",
    });
    serviceLogger.info(
      { instructorId, classId },
      "Verifying instructor ownership of class"
    );

    const data = await prisma.classes.findUnique({
      where: { id: classId },
      select: { instructor_id: true },
    });

    return data?.instructor_id === instructorId;
  }
}
