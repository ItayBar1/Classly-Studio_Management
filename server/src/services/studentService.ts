import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { logger } from "../logger";
import { AppError } from "../utils/AppError";
import bcrypt from "bcryptjs";
import crypto from "crypto";

interface StudentPayload {
  email: string;
  full_name: string;
  phone_number?: string;
  password?: string;
}

export const StudentService = {
  async getAll(
    studioId: string,
    page: number = 1,
    limit: number = 50,
    search: string = ""
  ) {
    const serviceLogger = logger.child({
      service: "StudentService",
      method: "getAll",
    });
    serviceLogger.info(
      { studioId, page, limit, search },
      "Fetching students list"
    );

    const skip = (page - 1) * limit;

    const where: Prisma.usersWhereInput = {
      role: "STUDENT",
      studio_id: studioId,
    };

    if (search) {
      where.full_name = {
        contains: search,
        mode: "insensitive",
      };
    }

    const [data, count] = await Promise.all([
      prisma.users.findMany({
        where,
        skip,
        take: limit,
        include: {
          enrollments_as_student: {
            where: { status: { in: ["ACTIVE", "PENDING"] } },
            select: { class: { select: { name: true } } },
          },
        },
      }),
      prisma.users.count({ where }),
    ]);

    const studentsWithClass = data.map(
      ({ enrollments_as_student, ...student }) => {
        const classNames = [
          ...new Set(
            enrollments_as_student
              .map((e) => e.class?.name)
              .filter((n): n is string => !!n)
          ),
        ];
        return { ...student, enrolledClasses: classNames };
      }
    );

    serviceLogger.info({ count }, "Students fetched successfully");
    return { data: studentsWithClass, count };
  },

  async getById(id: string, studioId?: string) {
    const serviceLogger = logger.child({
      service: "StudentService",
      method: "getById",
    });
    serviceLogger.info({ id, studioId }, "Fetching student by id");

    // Tenant isolation: a student in another studio must look absent.
    const data = studioId
      ? await prisma.users.findFirst({
          where: { id, studio_id: studioId },
        })
      : null;

    if (!data) {
      serviceLogger.error({ id }, "Student not found");
      throw new AppError("Student not found", 404);
    }
    return data;
  },

  async getByInstructor(instructorId: string) {
    // Retrieve enrollments for courses taught by the instructor
    const enrollments = await prisma.enrollments.findMany({
      where: {
        status: { in: ["ACTIVE", "PENDING"] },
        class: {
          instructor_id: instructorId,
        },
      },
      include: {
        student: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone_number: true,
            profile_image_url: true,
          },
        },
        class: {
          select: {
            name: true,
          },
        },
      },
    });

    // Consolidate data to remove duplicates
    const studentMap = new Map();

    enrollments.forEach((item) => {
      const studentData = item.student;
      if (!studentData || !studentData.id) return;

      const existing = studentMap.get(studentData.id);
      const className = item.class?.name;

      if (existing) {
        if (className && !existing.enrolledClass.includes(className)) {
          existing.enrolledClass += `, ${className}`;
        }
      } else {
        studentMap.set(studentData.id, {
          ...studentData,
          enrolledClass: className || "",
          role: "STUDENT",
        });
      }
    });

    return Array.from(studentMap.values());
  },

  async create(studioId: string, studentData: StudentPayload) {
    const serviceLogger = logger.child({
      service: "StudentService",
      method: "create",
    });
    serviceLogger.info(
      { studioId, email: studentData.email },
      "Creating student"
    );

    const { email, full_name, phone_number, password } = studentData;

    // Generate a secure random password if none is provided
    const rawPassword = password || crypto.randomBytes(32).toString("hex");
    const requiresPasswordReset = !password;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(rawPassword, salt);

    // Create user directly in DB with student role
    const data = await prisma.users.create({
      data: {
        email,
        password_hash,
        full_name,
        phone_number: phone_number || null,
        role: "STUDENT",
        studio_id: studioId,
        status: "ACTIVE",
        // Flag account as requiring password reset if no password was provided
        ...(requiresPasswordReset && {
          preferences: { force_password_reset: true },
        }),
      },
    });

    return data;
  },

  /**
   * Soft delete a student (set status to INACTIVE)
   */
  async deleteStudent(studentId: string, studioId?: string) {
    const serviceLogger = logger.child({
      service: "StudentService",
      method: "deleteStudent",
    });
    serviceLogger.info({ studentId, studioId }, "Soft deleting student");

    // 1. Ensure the user exists, is a student, and belongs to this studio.
    //    Scoping the lookup keeps an admin from removing another tenant's student.
    const user = studioId
      ? await prisma.users.findFirst({
          where: { id: studentId, studio_id: studioId },
          select: { role: true },
        })
      : null;

    if (!user) {
      serviceLogger.error({ studentId }, "Student not found during delete");
      throw new AppError("Student not found", 404);
    }

    if (user.role !== "STUDENT") {
      throw new AppError(
        "Cannot delete a user who is not a student via this endpoint",
        403
      );
    }

    // 2. Soft delete - update status
    const data = await prisma.users.update({
      where: { id: studentId },
      data: {
        status: "INACTIVE",
        updated_at: new Date(),
      },
    });

    serviceLogger.info({ studentId }, "Student soft deleted successfully");
    return data;
  },
};
