import { Request, Response, NextFunction } from "express";
import { EnrollmentService } from "../services/enrollmentService";
import { PaymentService } from "../services/paymentService";
import { prisma } from "../config/prisma";

export class EnrollmentController {
  // Admin enrolls a student manually
  static async adminEnrollStudent(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const requestLog = req.logger!;
    requestLog.info(
      { body: req.body, studioId: req.user!.studio_id },
      "Controller entry"
    );
    try {
      const { studentId, classId, notes } = req.body;
      const studioId = req.user!.studio_id;

      if (!studioId) {
        return res
          .status(400)
          .json({ error: "Studio ID is missing from user profile" });
      }

      if (!studentId || !classId) {
        return res
          .status(400)
          .json({ error: "Student ID and Class ID are required" });
      }

      const { enrollment } = await EnrollmentService.enrollStudent(
        studioId,
        studentId,
        classId,
        "ACTIVE",
        "PAID",
        notes
      );

      requestLog.info(
        { enrollmentId: enrollment.id },
        "Student enrolled by admin"
      );
      res.status(201).json(enrollment);
    } catch (error: any) {
      requestLog.error({ err: error }, "Error enrolling student by admin");
      next(error);
    }
  }

  /**
   * Handles self-registration for a student into a class.
   *
   * Flow:
   * 1. Pre-flight: validate course exists and get pricing (fail-fast).
   * 2. Free course → enroll directly, no Stripe.
   * 3. Paid course → create Stripe intent first (external, outside DB tx),
   *    then atomically create enrollment + payment record inside a prisma.$transaction.
   *    If Stripe fails, no DB writes occur. If the DB tx fails, the Stripe intent
   *    is abandoned (Stripe auto-expires unused intents).
   */
  static async studentSelfRegister(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const requestLog = req.logger!;
    requestLog.info(
      { userId: req.user!.id, body: req.body },
      "Controller entry"
    );

    const studentId = req.user!.id;
    const studioId = req.user!.studio_id;

    if (!studioId) {
      return res
        .status(400)
        .json({ error: "Studio ID is missing from user profile" });
    }
    const { classId } = req.body;

    if (!classId) {
      return res.status(400).json({ error: "Class ID is required" });
    }

    try {
      // 1. Pre-flight: validate course exists and get pricing (fails fast before Stripe)
      const courseInfo = await EnrollmentService.getCourseInfo(classId);

      // 2. Free course path — no Stripe, no payment record
      if (courseInfo.price.toNumber() === 0) {
        const { enrollment } = await EnrollmentService.enrollStudent(
          studioId,
          studentId,
          classId,
          "ACTIVE",
          "PAID"
        );
        return res.status(201).json({
          message: "Registration completed successfully",
          enrollmentId: enrollment.id,
          status: "active",
          amount: 0,
        });
      }

      // 3. Paid course — Stripe first, then atomic DB transaction
      const paymentIntent = await PaymentService.createIntent(
        courseInfo.price.toNumber(),
        "ils",
        `Registration for ${courseInfo.name}`,
        { student_id: studentId, class_id: classId }
      );

      const { enrollment } = await prisma.$transaction(async (tx) => {
        const { enrollment } = await EnrollmentService.enrollStudent(
          studioId,
          studentId,
          classId,
          "PENDING",
          "PENDING",
          undefined,
          tx
        );
        await PaymentService.createPaymentRecord(
          {
            studioId,
            studentId,
            enrollmentId: enrollment.id,
            amount: courseInfo.price.toNumber(),
            stripePaymentIntentId: paymentIntent.id,
          },
          tx
        );
        return { enrollment };
      });

      requestLog.info(
        { enrollmentId: enrollment.id, paymentIntentId: paymentIntent.id },
        "Self registration initiated"
      );
      res.status(201).json({
        message: "Registration initiated, proceed to payment",
        clientSecret: paymentIntent.clientSecret,
        enrollmentId: enrollment.id,
        amount: Number(courseInfo.price),
      });
    } catch (error: any) {
      // Convert third-party 401 errors (e.g., from Stripe) to 500 server errors
      // This prevents the client-side app from forcefully logging out the user
      if (error?.statusCode === 401) {
        error.statusCode = 500;
        error.message = "שגיאה בהתחברות לשירות התשלומים. אנא פנה להנהלה.";
      }
      next(error);
    }
  }

  // Student views own enrollments
  static async getMyEnrollments(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const requestLog = req.logger!;
    requestLog.info({ userId: req.user!.id }, "Controller entry");
    try {
      const studentId = req.user!.id;
      const enrollments =
        await EnrollmentService.getStudentEnrollments(studentId);
      requestLog.info(
        { count: enrollments?.length },
        "Fetched student enrollments"
      );
      res.json(enrollments);
    } catch (error: any) {
      requestLog.error({ err: error }, "Error fetching student enrollments");
      next(error);
    }
  }

  // Fetch enrollments for a class (instructor/admin)
  static async getClassEnrollments(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const requestLog = req.logger!;
    requestLog.info(
      { params: req.params, userId: req.user!.id },
      "Controller entry"
    );
    try {
      const { classId } = req.params;
      const userId = req.user!.id;

      // For instructors: ensure the class belongs to them
      if (req.user!.role === "INSTRUCTOR") {
        const isOwner = await EnrollmentService.verifyInstructorClass(
          userId,
          classId
        );
        if (!isOwner) {
          return res.status(403).json({
            error: "Not authorized to view enrollments for this class",
          });
        }
      }

      const enrollments = await EnrollmentService.getClassEnrollments(classId);
      requestLog.info(
        { count: enrollments?.length },
        "Fetched class enrollments"
      );
      res.json(enrollments);
    } catch (error: any) {
      requestLog.error({ err: error }, "Error fetching class enrollments");
      next(error);
    }
  }

  // Cancel an enrollment
  static async cancelEnrollment(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const requestLog = req.logger!;
    requestLog.info(
      { params: req.params, userId: req.user!.id },
      "Controller entry"
    );
    try {
      const { id } = req.params;

      // SECURITY: If user is a STUDENT, enforce ownership and restrict to PENDING only
      if (req.user!.role === "STUDENT") {
        const enrollment = await prisma.enrollments.findUnique({
          where: { id },
          select: { student_id: true, status: true },
        });

        if (!enrollment) {
          return res.status(404).json({ error: "Enrollment not found" });
        }

        // Ownership check: student can only cancel their own enrollments
        if (enrollment.student_id !== req.user!.id) {
          requestLog.warn(
            { enrollmentId: id, studentId: req.user!.id },
            "IDOR attempt: student tried to cancel another student's enrollment"
          );
          return res
            .status(403)
            .json({ error: "Not authorized to cancel this enrollment" });
        }

        // Status check: students can only cancel PENDING enrollments
        if (enrollment.status !== "PENDING") {
          return res.status(403).json({
            error:
              "Only pending enrollments can be cancelled. Please contact your studio admin.",
          });
        }
      }

      await EnrollmentService.cancelEnrollment(id);
      requestLog.info({ enrollmentId: id }, "Enrollment cancelled");
      res.json({ message: "Enrollment cancelled successfully" });
    } catch (error: any) {
      requestLog.error({ err: error }, "Error cancelling enrollment");
      next(error);
    }
  }
  // Admin fetches enrollments for a specific student
  static async getStudentEnrollments(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const requestLog = req.logger!;
    requestLog.info({ params: req.params }, "Controller entry");
    try {
      const { studentId } = req.params;
      const enrollments =
        await EnrollmentService.getStudentEnrollments(studentId);
      requestLog.info(
        { count: enrollments?.length },
        "Fetched student enrollments for admin"
      );
      res.json(enrollments);
    } catch (error: any) {
      requestLog.error({ err: error }, "Error fetching student enrollments");
      next(error);
    }
  }
}
