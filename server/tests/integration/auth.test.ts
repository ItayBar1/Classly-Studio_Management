import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../src/app";
import { prisma } from "../../src/config/prisma";
import { environment } from "../../src/config/env";

// Mock Prisma — do NOT mock authMiddleware; we test real JWT verification
jest.mock("../../src/config/prisma", () => ({
  prisma: {
    users: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("../../src/logger", () => ({
  logger: {
    child: () => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }),
  },
  requestLogger: (req: any, _res: any, next: any) => {
    req.logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    next();
  },
}));

const mockPrisma = prisma as any;
const secret = environment.jwtSecret;

function signToken(payload: object, options?: jwt.SignOptions) {
  return jwt.sign(payload, secret, { expiresIn: "1h", ...options });
}

describe("Auth middleware (integration)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when no cookie is present", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Not authenticated");
  });

  it("returns 401 for expired token", async () => {
    const token = signToken(
      { userId: "user-1", email: "a@b.com", role: "STUDENT" },
      { expiresIn: "-1s" }
    );

    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", `classly_token=${token}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Token expired");
  });

  it("returns 403 for suspended user", async () => {
    mockPrisma.users.findUnique.mockResolvedValue({
      id: "user-1",
      role: "STUDENT",
      studio_id: "studio-1",
      status: "SUSPENDED",
    });

    const token = signToken({
      userId: "user-1",
      email: "a@b.com",
      role: "STUDENT",
    });

    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", `classly_token=${token}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Account is suspended");
  });

  it("returns user profile for valid token", async () => {
    mockPrisma.users.findUnique.mockResolvedValue({
      id: "user-1",
      role: "ADMIN",
      studio_id: "studio-1",
      status: "ACTIVE",
    });

    const token = signToken({
      userId: "user-1",
      email: "a@b.com",
      role: "ADMIN",
    });

    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", `classly_token=${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: "user-1",
      role: "ADMIN",
      studio_id: "studio-1",
    });
  });

  it("queries only lean select fields (id, role, studio_id, status)", async () => {
    mockPrisma.users.findUnique.mockResolvedValue({
      id: "user-1",
      role: "STUDENT",
      studio_id: "studio-1",
      status: "ACTIVE",
    });

    const token = signToken({
      userId: "user-1",
      email: "a@b.com",
      role: "STUDENT",
    });

    await request(app)
      .get("/api/auth/me")
      .set("Cookie", `classly_token=${token}`);

    // The /api/auth/me handler also calls findUnique, so we check the first call
    // which comes from the auth middleware (used on protected routes)
    // or the me handler itself. Both should use lean select.
    expect(mockPrisma.users.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        select: { id: true, role: true, studio_id: true, status: true },
      })
    );
  });
});
