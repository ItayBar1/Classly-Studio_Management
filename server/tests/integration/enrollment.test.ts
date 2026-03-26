import request from "supertest";
import app from "../../src/app";
import { prisma } from "../../src/config/prisma";

// Mock authMiddleware to inject a test user
jest.mock("../../src/middleware/authMiddleware", () => ({
  authenticateUser: (req: any, _res: any, next: any) => {
    const roleHeader = (
      req.headers["x-test-role"] as string | undefined
    )?.toUpperCase();
    req.user = {
      id: "student-1",
      role: roleHeader || "STUDENT",
      studio_id: "studio-1",
      status: "ACTIVE",
    };
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
    classes: { findUnique: jest.fn() },
    enrollments: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    payments: { create: jest.fn() },
    $transaction: jest.fn(),
  },
}));

jest.mock("../../src/services/paymentService", () => {
  const original = jest.requireActual("../../src/services/paymentService");
  return {
    ...original,
    PaymentService: {
      ...original.PaymentService,
      createIntent: jest.fn(),
      createPaymentRecord: jest.fn(),
    },
  };
});

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
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PaymentService } = require("../../src/services/paymentService");

describe("POST /api/enrollments/register (self-register)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 201 with clientSecret for paid course", async () => {
    // getCourseInfo lookup
    mockPrisma.classes.findUnique.mockResolvedValue({
      name: "Yoga",
      price_ils: { toNumber: () => 100 },
    });

    PaymentService.createIntent.mockResolvedValue({
      id: "pi_123",
      clientSecret: "secret_123",
    });

    // $transaction executes callback immediately
    mockPrisma.$transaction.mockImplementation(async (fn: any) => {
      // Provide mock results for enrollStudent + createPaymentRecord inside tx
      const enrollment = { id: "enroll-1" };
      // The fn receives a tx client — we simulate it by returning the enrollment
      return fn({
        classes: {
          findUnique: jest.fn().mockResolvedValue({
            max_capacity: 20,
            current_enrollment: 5,
            price_ils: 100,
            name: "Yoga",
          }),
        },
        enrollments: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue(enrollment),
        },
        payments: {
          create: jest.fn().mockResolvedValue({ id: "pay-1" }),
        },
      });
    });

    const res = await request(app)
      .post("/api/enrollments/register")
      .send({ classId: "class-1" });

    expect(res.status).toBe(201);
    expect(res.body.clientSecret).toBe("secret_123");
    expect(res.body.enrollmentId).toBe("enroll-1");
  });

  it("returns 201 without clientSecret for free course", async () => {
    // getCourseInfo lookup
    mockPrisma.classes.findUnique.mockResolvedValue({
      name: "Free Intro",
      price_ils: { toNumber: () => 0 },
      max_capacity: 20,
      current_enrollment: 5,
    });

    mockPrisma.enrollments.findFirst.mockResolvedValue(null);
    mockPrisma.enrollments.create.mockResolvedValue({
      id: "free-enroll-1",
      status: "ACTIVE",
    });

    const res = await request(app)
      .post("/api/enrollments/register")
      .send({ classId: "class-free" });

    expect(res.status).toBe(201);
    expect(res.body.amount).toBe(0);
    expect(res.body.clientSecret).toBeUndefined();
  });

  it("returns 404 when course is not found", async () => {
    mockPrisma.classes.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/enrollments/register")
      .send({ classId: "nonexistent" });

    expect(res.status).toBe(404);
  });

  it("returns 409 for duplicate enrollment", async () => {
    mockPrisma.classes.findUnique.mockResolvedValue({
      name: "Yoga",
      price_ils: { toNumber: () => 0 },
      max_capacity: 20,
      current_enrollment: 5,
    });
    mockPrisma.enrollments.findFirst.mockResolvedValue({ id: "existing" });

    const res = await request(app)
      .post("/api/enrollments/register")
      .send({ classId: "class-1" });

    expect(res.status).toBe(409);
  });

  it("returns 409 when course is full", async () => {
    // Use a free course so enrollStudent runs directly (not inside $transaction)
    mockPrisma.classes.findUnique.mockResolvedValue({
      name: "Yoga",
      price_ils: { toNumber: () => 0 },
      max_capacity: 10,
      current_enrollment: 10,
    });
    mockPrisma.enrollments.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/enrollments/register")
      .send({ classId: "class-1" });

    expect(res.status).toBe(409);
  });

  it("does not call $transaction when Stripe fails", async () => {
    mockPrisma.classes.findUnique.mockResolvedValue({
      name: "Yoga",
      price_ils: { toNumber: () => 100 },
    });

    PaymentService.createIntent.mockRejectedValue(new Error("Stripe down"));

    const res = await request(app)
      .post("/api/enrollments/register")
      .send({ classId: "class-1" });

    expect(res.status).toBe(500);
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });
});
