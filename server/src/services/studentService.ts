import { prisma } from "../config/supabase";
import { logger } from "../logger";
import bcrypt from "bcryptjs";

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
    search: string = "",
  ) {
    const serviceLogger = logger.child({
      service: "StudentService",
      method: "getAll",
    });
    serviceLogger.info(
      { studioId, page, limit, search },
      "Fetching students list",
    );

    const skip = (page - 1) * limit;

    const where: any = {
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
      }),
      prisma.users.count({ where }),
    ]);

    serviceLogger.info({ count }, "Students fetched successfully");
    return { data, count };
  },

  async getById(id: string) {
    const serviceLogger = logger.child({
      service: "StudentService",
      method: "getById",
    });
    serviceLogger.info({ id }, "Fetching student by id");

    const data = await prisma.users.findUnique({
      where: { id },
    });

    if (!data) {
      serviceLogger.error({ id }, "Student not found");
      throw new Error("Student not found");
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
      "Creating student",
    );

    const { email, full_name, phone_number, password } = studentData;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password || "123456", salt);

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
      },
    });

    return data;
  },

  /**
   * Soft delete a student (set status to INACTIVE)
   */
  async deleteStudent(studentId: string) {
    const serviceLogger = logger.child({
      service: "StudentService",
      method: "deleteStudent",
    });
    serviceLogger.info({ studentId }, "Soft deleting student");

    // 1. Ensure the user exists and is a student
    const user = await prisma.users.findUnique({
      where: { id: studentId },
      select: { role: true },
    });

    if (!user) {
      serviceLogger.error({ studentId }, "Student not found during delete");
      throw new Error("Student not found");
    }

    if (user.role !== "STUDENT") {
      throw new Error(
        "Cannot delete a user who is not a student via this endpoint",
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
