import { prisma } from "../config/prisma";
import { logger } from "../logger";

export class UserService {
  /**
   * Retrieve a full user profile by ID
   */
  static async getUserProfile(userId: string) {
    const serviceLogger = logger.child({
      service: "UserService",
      method: "getUserProfile",
    });
    serviceLogger.info({ userId }, "Fetching user profile");

    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      serviceLogger.error({ userId }, "User profile not found");
      throw new Error("User profile not found");
    }

    serviceLogger.info({ userId }, "User profile fetched successfully");
    return user;
  }

  /**
   * Validate studio existence by serial number
   */
  static async validateStudioSerial(serialNumber: string) {
    const serviceLogger = logger.child({
      service: "UserService",
      method: "validateStudioSerial",
    });
    serviceLogger.info({ serialNumber }, "Validating studio serial number");

    const studio = await prisma.studios.findUnique({
      where: { serial_number: serialNumber },
      select: { id: true, name: true },
    });

    if (!studio) {
      serviceLogger.warn({ serialNumber }, "Studio serial number not found");
      return null;
    }

    serviceLogger.info(
      { studioId: studio.id },
      "Studio serial validated successfully",
    );
    return studio;
  }

  /**
   * SECURITY: Create a pending registration with validated studio_id
   */
  static async createPendingRegistration(
    email: string,
    studioId: string,
    invitationToken?: string,
    role?: "ADMIN" | "INSTRUCTOR" | "SUPER_ADMIN",
  ) {
    const serviceLogger = logger.child({
      service: "UserService",
      method: "createPendingRegistration",
    });
    serviceLogger.info(
      { email, studioId, role },
      "Creating pending registration with validated studio",
    );

    // Delete any existing unused pending registrations for this email
    try {
      await prisma.pending_registrations.deleteMany({
        where: {
          email,
          used: false,
        },
      });
    } catch (deleteError) {
      serviceLogger.warn(
        { err: deleteError },
        "Failed to delete old pending registrations",
      );
    }

    // Create new pending registration
    const pendingReg = await prisma.pending_registrations.create({
      data: {
        email,
        studio_id: studioId,
        invitation_token: invitationToken || null,
        role: role || null,
      },
    });

    serviceLogger.info(
      { email, studioId, role },
      "Pending registration created successfully",
    );
    return pendingReg;
  }
}
