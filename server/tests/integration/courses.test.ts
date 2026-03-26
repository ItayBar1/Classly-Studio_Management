import request from "supertest";
import app from "../../src/app";
import { prisma } from "../../src/config/prisma";

jest.mock("../../src/middleware/authMiddleware", () => ({
  authenticateUser: (req: any, _res: any, next: any) => {
    const roleHeader = (
      req.headers["x-test-role"] as string | undefined
    )?.toUpperCase();
    const role = roleHeader || "ADMIN";
    req.user = { id: "user-1", role, studio_id: "studio-1" };
    req.studioId = "studio-1";
    next();
  },
  requireRole: (allowedRoles: string[]) => {
    const normalized = allowedRoles.map((r) => r.toUpperCase());
    return (req: any, res: any, next: any) => {
      const role = (req.user?.role || "").toUpperCase();
      if (!role || !normalized.includes(role)) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      next();
    };
  },
}));

jest.mock("../../src/config/prisma", () => ({
  prisma: {
    classes: {
      findMany: jest.fn(),
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
    req.logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
    next();
  },
}));

const mockPrisma = prisma as any;

describe("Course routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns all courses for admin", async () => {
    const courses = [{ id: "1", name: "Yoga", is_active: true }];
    mockPrisma.classes.findMany.mockResolvedValue(courses);

    const response = await request(app).get("/api/courses");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(courses);
    // Admin: no is_active filter in where clause
    expect(mockPrisma.classes.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    );
  });

  it("filters active courses for students", async () => {
    mockPrisma.classes.findMany.mockResolvedValue([]);

    const response = await request(app)
      .get("/api/courses")
      .set("x-test-role", "student");

    expect(response.status).toBe(200);
    expect(mockPrisma.classes.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { is_active: true } })
    );
  });
});
