import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma";
import { logger } from "../logger";
import { environment } from "../config/env";

// SECURITY: Validation to prevent insecure production deployments
if (environment.nodeEnv === "production" && !environment.jwtSecret) {
  throw new Error("FATAL: JWT_SECRET is missing in production.");
}

const JWT_SECRET = environment.jwtSecret;

// Define the custom claims we add to the token
interface InvitationClaims {
  role: "ADMIN" | "INSTRUCTOR";
  studioId: string | null;
  creatorId: string;
}

const ISSUER = "classly-backend";
const AUDIENCE = "classly-users";

const JWT_OPTIONS: jwt.SignOptions = {
  expiresIn: "7d",
  issuer: ISSUER,
  audience: AUDIENCE,
};

export class InvitationService {
  static async createInvitation(
    creatorId: string,
    role: "ADMIN" | "INSTRUCTOR",
    studioId: string | null = null,
  ) {
    logger.info({ creatorId, role, studioId }, "Creating invitation token");

    const claims: InvitationClaims = { role, studioId, creatorId };
    const token = jwt.sign(claims, JWT_SECRET, JWT_OPTIONS);

    return {
      token,
      ...claims,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
  }

  // Validate an invitation token
  static async validateInvitation(token: string) {
    logger.info("Validating invitation token");

    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        issuer: ISSUER,
        audience: AUDIENCE,
      }) as InvitationClaims & jwt.JwtPayload;

      let studio: any = null;
      if (decoded.studioId) {
        studio = await prisma.studios.findUnique({
          where: { id: decoded.studioId },
          select: { name: true, serial_number: true },
        });
      }

      return { valid: true, ...decoded, studio };
    } catch (error: any) {
      logger.warn({ err: error.message }, "Invalid or expired token");
      return null;
    }
  }

  // Accept an invitation: Promote the user
  static async acceptInvitation(token: string, userId: string) {
    logger.info({ userId }, "Accepting invitation");

    const invitation = await this.validateInvitation(token);
    if (!invitation || !invitation.valid) {
      throw new Error("Invalid or expired invitation token");
    }

    const { role, studioId } = invitation;

    // Update public.users
    await prisma.users.update({
      where: { id: userId },
      data: { role, studio_id: studioId },
    });

    logger.info(
      { userId, role, studioId },
      "User successfully promoted via invitation",
    );
    return { success: true, role, studioId };
  }

  // Stateless tokens cannot be "marked as used" without a blacklist.
  static async markAsUsed(token: string) {
    return;
  }
}
