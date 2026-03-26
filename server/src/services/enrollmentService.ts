import { prisma } from "../config/prisma";
import { logger } from "../logger";
import { AppError } from "../utils/AppError";

export class EnrollmentService {
  /**
   * Enroll a student to a class.
   */
  static async enrollStudent(
    studioId: string,
    studentId: string,
    classId: string,
    status: "ACTIVE" | "PENDING" = "ACTIVE",
    paymentStatus: "PAID" | "PENDING" | "OVERDUE" = "PAID",
    notes?: string
  ) {
    const serviceLogger = logger.child({
      service: "EnrollmentService",
      method: "enrollStudent",
    });
    serviceLogger.info(
      { studioId, studentId, classId, status, paymentStatus },
      "Enrolling student to class"
    );

    // 1. Fetch course details (capacity and pricing)
    const course = await prisma.classes.findUnique({
      where: { id: classId },
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
      throw new Error("Course not found");
    }

    // 2. Validate capacity
    if ((course.current_enrollment || 0) >= course.max_capacity) {
      serviceLogger.warn({ classId }, "Course is full");
      throw new Error("Course is full");
    }

    // 3. Prevent duplicate enrollment
    const existing = await prisma.enrollments.findFirst({
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
    const enrollment = await prisma.enrollments.create({
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
  static async getStudentEnrollments(studentId: string) {
    const serviceLogger = logger.child({
      service: "EnrollmentService",
      method: "getStudentEnrollments",
    });
    serviceLogger.info({ studentId }, "Fetching student enrollments");

    const data = await prisma.enrollments.findMany({
      where: {
        student_id: studentId,
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
  static async getClassEnrollments(classId: string) {
    const serviceLogger = logger.child({
      service: "EnrollmentService",
      method: "getClassEnrollments",
    });
    serviceLogger.info({ classId }, "Fetching class enrollments");

    const data = await prisma.enrollments.findMany({
      where: {
        class_id: classId,
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
  static async cancelEnrollment(enrollmentId: string) {
    const serviceLogger = logger.child({
      service: "EnrollmentService",
      method: "cancelEnrollment",
    });
    serviceLogger.info({ enrollmentId }, "Cancelling enrollment");

    const enrollment = await prisma.enrollments.findUnique({
      where: { id: enrollmentId },
      select: { class_id: true, status: true },
    });

    if (!enrollment) {
      serviceLogger.warn({ enrollmentId }, "Enrollment not found");
      throw new Error("Enrollment not found");
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
