import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma";
import { environment } from "../config/env";

// Note: Request.user and Request.studioId types are defined in src/types/express.d.ts

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies?.classly_token;

  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    // 1. Verify the JWT token locally
    const decoded = jwt.verify(token, environment.jwtSecret) as JwtPayload;

    // 2. Fetch user profile from database
    const userData = await prisma.users.findUnique({
      where: { id: decoded.userId },
    });

    if (!userData) {
      return res.status(403).json({ error: "User profile not found" });
    }

    if (userData.status === "SUSPENDED") {
      return res.status(403).json({ error: "Account is suspended" });
    }

    // 3. Attach user to the Request for downstream handlers
    req.user = userData;
    req.studioId = userData.studio_id || undefined;

    next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    return res.status(500).json({ error: "Internal Server Error during auth" });
  }
};

// Middleware to enforce required roles
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.role || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
};
