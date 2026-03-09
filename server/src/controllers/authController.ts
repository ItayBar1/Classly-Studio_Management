import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/supabase";
import { environment } from "../config/env";
import { logger } from "../logger";

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
        role,
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
      let userRole = role || "STUDENT";

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
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Compare password
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
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
}
