import { Request, Response, NextFunction } from "express";
import { EnrollmentService } from "../services/enrollmentService";
import { PaymentService } from "../services/paymentService";
import { logger } from "../logger";

export class EnrollmentController {
  // Admin enrolls a student manually
  static async adminEnrollStudent(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const requestLog =
      req.logger ||
      logger.child({
        controller: "EnrollmentController",
        method: "adminEnrollStudent",
      });
    requestLog.info(
      { body: req.body, studioId: req.user.studio_id },
      "Controller entry"
    );
    try {
      const { studentId, classId, notes } = req.body;
      const studioId = req.user.studio_id;

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

  // Student self-registration (creates PENDING enrollment + payment + Stripe intent)
  static async studentSelfRegister(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const requestLog =
      req.logger ||
      logger.child({
        controller: "EnrollmentController",
        method: "studentSelfRegister",
      });
    requestLog.info(
      { userId: req.user.id, body: req.body },
      "Controller entry"
    );

    // Variable to track if enrollment was created, allowing rollback on error
    let createdEnrollmentId: string | null = null;

    try {
      const studentId = req.user.id;
      const studioId = req.user.studio_id;
      const { classId } = req.body;

      if (!classId) {
        return res.status(400).json({ error: "Class ID is required" });
      }

      // 1. Create a PENDING enrollment and collect pricing
      const { enrollment, courseDetails } =
        await EnrollmentService.enrollStudent(
          studioId,
          studentId,
          classId,
          "PENDING", // Enrollment status awaiting payment
          "PENDING" // Payment status awaiting payment
        );

      // Capture ID for potential rollback
      createdEnrollmentId = enrollment.id;

      // If the course is free (rare), we could complete without payment
      if (courseDetails.price === 0) {
        // Future: set to ACTIVE when free (assuming paid for now)
      }

      // 2. Create a Stripe Payment Intent
      const paymentIntent = await PaymentService.createIntent(
        courseDetails.price,
        "ils",
        `Registration for ${courseDetails.name}`,
        {
          enrollment_id: enrollment.id,
          student_id: studentId,
          class_id: classId,
        }
      );

      // 3. Create a PENDING payment record locally
      // Ensures confirmPayment has a backing record
      await PaymentService.createPaymentRecord({
        studioId: studioId,
        studentId: studentId,
        enrollmentId: enrollment.id,
        amount: courseDetails.price,
        stripePaymentIntentId: paymentIntent.id,
      });

      // 4. Return client secret to the client
      requestLog.info(
        { enrollmentId: enrollment.id, paymentIntentId: paymentIntent.id },
        "Self registration initiated"
      );
      res.status(201).json({
        message: "Registration initiated, proceed to payment",
        clientSecret: paymentIntent.clientSecret, // Consumed by Stripe Elements on the client
        enrollmentId: enrollment.id,
        amount: courseDetails.price,
      });
    } catch (error: any) {
      requestLog.error(
        { err: error },
        "Error during student self registration"
      );

      // --- Rollback Logic ---
      // If enrollment was created but subsequent steps (payment) failed, cancel it.
      if (createdEnrollmentId) {
        requestLog.warn(
          { enrollmentId: createdEnrollmentId },
          "Rolling back enrollment due to process failure"
        );
        try {
          await EnrollmentService.cancelEnrollment(createdEnrollmentId);
          requestLog.info(
            { enrollmentId: createdEnrollmentId },
            "Rollback successful: Enrollment cancelled"
          );
        } catch (rollbackError) {
          // Log critical failure if rollback also fails
          requestLog.error(
            { err: rollbackError, enrollmentId: createdEnrollmentId },
            "CRITICAL: Failed to rollback enrollment after error"
          );
        }
      }
      // ----------------------

      next(error);
    }
  }

  // Student views own enrollments
  static async getMyEnrollments(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const requestLog =
      req.logger ||
      logger.child({
        controller: "EnrollmentController",
        method: "getMyEnrollments",
      });
    requestLog.info({ userId: req.user.id }, "Controller entry");
    try {
      const studentId = req.user.id;
      const enrollments = await EnrollmentService.getStudentEnrollments(
        studentId
      );
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
    const requestLog =
      req.logger ||
      logger.child({
        controller: "EnrollmentController",
        method: "getClassEnrollments",
      });
    requestLog.info(
      { params: req.params, userId: req.user.id },
      "Controller entry"
    );
    try {
      const { classId } = req.params;
      const userId = req.user.id;

      // For instructors: ensure the class belongs to them
      if (req.user.role === "INSTRUCTOR") {
        const isOwner = await EnrollmentService.verifyInstructorClass(
          userId,
          classId
        );
        if (!isOwner) {
          return res
            .status(403)
            .json({
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
    const requestLog =
      req.logger ||
      logger.child({
        controller: "EnrollmentController",
        method: "cancelEnrollment",
      });
    requestLog.info({ params: req.params }, "Controller entry");
    try {
      const { id } = req.params;
      await EnrollmentService.cancelEnrollment(id);
      requestLog.info({ enrollmentId: id }, "Enrollment cancelled");
      res.json({ message: "Enrollment cancelled successfully" });
    } catch (error: any) {
      requestLog.error({ err: error }, "Error cancelling enrollment");
      next(error);
    }
  }
}
