import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/supabase";
import { environment } from "../config/env";
import { logger } from "../logger";
import { EmailService } from "../services/emailService";

const JWT_SECRET = environment.jwtSecret;

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export class AuthController {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  static async register(req: Request, res: Response, next: NextFunction) {
    const requestLog = logger.child({
      controller: "AuthController",
      method: "register",
    });

    try {
      const {
        email,
        password,
        full_name,
        phone_number,
        studio_serial,
        invitationToken,
      } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "Email and password are required" });
      }

      // Check if user already exists
      const existingUser = await prisma.users.findUnique({ where: { email } });
      if (existingUser) {
        return res
          .status(409)
          .json({ error: "User with this email already exists" });
      }

      // Determine studio_id
      let studioId: string | null = null;
      // SECURITY: Default to STUDENT. Only invitation tokens may grant elevated roles.
      let userRole = "STUDENT";

      // If invitation token provided, validate it
      if (invitationToken) {
        const { InvitationService } =
          await import("../services/invitationService");
        const invitation =
          await InvitationService.validateInvitation(invitationToken);
        if (!invitation || !invitation.valid) {
          return res
            .status(400)
            .json({ error: "Invalid or expired invitation token" });
        }
        studioId = invitation.studioId;
        userRole = invitation.role;
      } else if (studio_serial) {
        // Validate studio serial number
        const studio = await prisma.studios.findUnique({
          where: { serial_number: studio_serial },
          select: { id: true },
        });
        if (!studio) {
          return res.status(404).json({
            error: "Studio not found with the provided serial number",
          });
        }
        studioId = studio.id;
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      // Create user
      const newUser = await prisma.users.create({
        data: {
          email,
          password_hash,
          full_name: full_name || null,
          phone_number: phone_number || null,
          role: userRole,
          studio_id: studioId,
          status: "ACTIVE",
        },
      });

      // Sign JWT
      const token = jwt.sign(
        {
          userId: newUser.id,
          email: newUser.email,
          role: newUser.role,
        } as JwtPayload,
        JWT_SECRET,
        { expiresIn: "7d" },
      );

      requestLog.info(
        { userId: newUser.id, email },
        "User registered successfully",
      );

      res.status(201).json({
        message: "User registered successfully",
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          full_name: newUser.full_name,
          role: newUser.role,
          studio_id: newUser.studio_id,
        },
      });
    } catch (error) {
      requestLog.error({ err: error }, "Registration failed");
      next(error);
    }
  }

  /**
   * Login with email and password
   * POST /api/auth/login
   */
  static async login(req: Request, res: Response, next: NextFunction) {
    const requestLog = logger.child({
      controller: "AuthController",
      method: "login",
    });

    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "Email and password are required" });
      }

      // Find user
      const user = await prisma.users.findUnique({ where: { email } });
      if (!user) {
        requestLog.info({ email }, "Login failed: user not found");
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Debug: check if password_hash looks like a bcrypt hash
      const isBcryptHash = user.password_hash.startsWith('$2a$') || user.password_hash.startsWith('$2b$');
      if (!isBcryptHash) {
        requestLog.warn(
          { userId: user.id, email },
          "User password_hash is not a bcrypt hash. Run the rehash script: npx ts-node scripts/rehash-superadmin.ts"
        );
      }

      // Compare password
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        requestLog.info({ userId: user.id, email }, "Login failed: password mismatch");
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Check if user is active
      if (user.status === "SUSPENDED") {
        return res.status(403).json({ error: "Account is suspended" });
      }

      // Update login tracking
      await prisma.users.update({
        where: { id: user.id },
        data: {
          last_login_at: new Date(),
          login_count: (user.login_count || 0) + 1,
        },
      });

      // Sign JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role } as JwtPayload,
        JWT_SECRET,
        { expiresIn: "7d" },
      );

      requestLog.info(
        { userId: user.id, email },
        "User logged in successfully",
      );

      res.status(200).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          studio_id: user.studio_id,
          profile_image_url: user.profile_image_url,
        },
      });
    } catch (error) {
      requestLog.error({ err: error }, "Login failed");
      next(error);
    }
  }

  /**
   * Request a password reset email
   * POST /api/auth/forgot-password
   */
  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    const requestLog = logger.child({
      controller: "AuthController",
      method: "forgotPassword",
    });

    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Always return 200 to not reveal if the email exists
      const user = await prisma.users.findUnique({ where: { email } });

      if (user) {
        // Generate a secure random token
        const rawToken = crypto.randomBytes(32).toString('hex');
        // Store a hash of the token (never store raw tokens)
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

        // Invalidate any existing unused tokens for this user
        await prisma.password_reset_tokens.updateMany({
          where: { user_id: user.id, used: false },
          data: { used: true },
        });

        // Create the reset token (expires in 1 hour)
        await prisma.password_reset_tokens.create({
          data: {
            user_id: user.id,
            token_hash: tokenHash,
            expires_at: new Date(Date.now() + 60 * 60 * 1000),
          },
        });

        // Send the email (or log in dev)
        try {
          await EmailService.sendPasswordResetEmail(email, rawToken);
          requestLog.info({ email }, "Password reset email sent");
        } catch (emailError) {
          requestLog.error({ err: emailError, email }, "Failed to send reset email");
          // Don't fail the request — the token is saved, the link is in the logs
        }
      } else {
        requestLog.info({ email }, "Password reset requested for non-existent email");
      }

      // Always return the same response
      res.status(200).json({
        message: "If an account with that email exists, a password reset link has been sent.",
      });
    } catch (error) {
      requestLog.error({ err: error }, "Forgot password failed");
      next(error);
    }
  }

  /**
   * Reset password with a valid token
   * POST /api/auth/reset-password
   */
  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    const requestLog = logger.child({
      controller: "AuthController",
      method: "resetPassword",
    });

    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ error: "Token and new password are required" });
      }

      if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }

      // Hash the incoming token to compare with stored hash
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      // Find a valid, unused, non-expired token
      const resetToken = await prisma.password_reset_tokens.findFirst({
        where: {
          token_hash: tokenHash,
          used: false,
          expires_at: { gt: new Date() },
        },
      });

      if (!resetToken) {
        return res.status(400).json({ error: "קישור האיפוס אינו תקין או שפג תוקפו" });
      }

      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Update user password and mark token as used (in a transaction)
      await prisma.$transaction([
        prisma.users.update({
          where: { id: resetToken.user_id },
          data: { password_hash: passwordHash },
        }),
        prisma.password_reset_tokens.update({
          where: { id: resetToken.id },
          data: { used: true },
        }),
      ]);

      requestLog.info({ userId: resetToken.user_id }, "Password reset successful");

      res.status(200).json({ message: "הסיסמה עודכנה בהצלחה" });
    } catch (error) {
      requestLog.error({ err: error }, "Password reset failed");
      next(error);
    }
  }
}
