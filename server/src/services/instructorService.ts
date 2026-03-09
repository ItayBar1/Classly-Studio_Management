import { prisma } from "../config/supabase";
import { logger } from "../logger";

export class InstructorService {
  /**
   * Get all instructors for a specific studio
   */
  static async getAllInstructors(studioId: string) {
    const serviceLogger = logger.child({
      service: "InstructorService",
      method: "getAllInstructors",
    });
    serviceLogger.info({ studioId }, "Fetching all instructors");

    const data = await prisma.users.findMany({
      where: {
        role: "INSTRUCTOR",
        studio_id: studioId,
      },
      select: {
        id: true,
        full_name: true,
        email: true,
        phone_number: true,
        profile_image_url: true,
        status: true,
        created_at: true,
      },
    });

    return data;
  }

  /**
   * Get single instructor details
   */
  static async getInstructorById(id: string) {
    const serviceLogger = logger.child({
      service: "InstructorService",
      method: "getInstructorById",
    });
    serviceLogger.info({ id }, "Fetching instructor by id");

    const data = await prisma.users.findFirst({
      where: {
        id,
        role: "INSTRUCTOR",
      },
    });

    if (!data) {
      serviceLogger.error({ id }, "Instructor not found");
      throw new Error("Instructor not found");
    }
    return data;
  }

  /**
   * Soft delete instructor (change status to INACTIVE)
   */
  static async softDeleteInstructor(id: string) {
    const serviceLogger = logger.child({
      service: "InstructorService",
      method: "softDeleteInstructor",
    });
    serviceLogger.info({ id }, "Soft deleting instructor");

    // Verify user is an instructor before updating
    const user = await prisma.users.findFirst({
      where: { id, role: "INSTRUCTOR" },
    });

    if (!user) {
      throw new Error("Instructor not found");
    }

    await prisma.users.update({
      where: { id },
      data: { status: "INACTIVE" },
    });

    return true;
  }

  /**
   * Get earnings/commissions for an instructor
   */
  static async getEarnings(instructorId: string) {
    const serviceLogger = logger.child({
      service: "InstructorService",
      method: "getEarnings",
    });
    serviceLogger.info({ instructorId }, "Fetching instructor earnings");

    const data = await prisma.instructor_commissions.findMany({
      where: { instructor_id: instructorId },
      include: {
        class: {
          select: { name: true },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return data;
  }
}
