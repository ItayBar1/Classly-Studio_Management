import { EnrollmentService } from "../../src/services/enrollmentService";
import { prisma } from "../../src/config/prisma";

// jest.mock is hoisted before variable declarations, so the mock object must be
// defined inside the factory — not in the outer scope.
jest.mock("../../src/config/prisma", () => ({
  prisma: {
    classes: {
      findUnique: jest.fn(),
    },
    enrollments: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
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
}));

// Alias for ergonomic access to mock functions in test bodies.
const mockPrisma = prisma as any;

/** Simulates a Prisma Decimal so that Number(mock) works correctly. */
const mockDecimal = (n: number) => ({
  toNumber: () => n,
  valueOf: () => n,
  toString: () => String(n),
});

describe("EnrollmentService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getCourseInfo", () => {
    it("returns course name and price", async () => {
      mockPrisma.classes.findUnique.mockResolvedValue({
        name: "Yoga",
        price_ils: mockDecimal(120),
      });

      const info = await EnrollmentService.getCourseInfo("class-1");
      expect(info.name).toBe("Yoga");
      expect(Number(info.price)).toBe(120);
      expect(mockPrisma.classes.findUnique).toHaveBeenCalledWith({
        where: { id: "class-1" },
        select: { name: true, price_ils: true },
      });
    });

    it("throws 404 if course not found", async () => {
      mockPrisma.classes.findUnique.mockResolvedValue(null);
      await expect(
        EnrollmentService.getCourseInfo("nonexistent")
      ).rejects.toThrow("Course not found");
    });
  });

  describe("enrollStudent", () => {
    it("throws if course is not found", async () => {
      mockPrisma.classes.findUnique.mockResolvedValue(null);
      await expect(
        EnrollmentService.enrollStudent("studio-1", "student-1", "class-1")
      ).rejects.toThrow("Course not found");
    });

    it("throws if course is full", async () => {
      mockPrisma.classes.findUnique.mockResolvedValue({
        max_capacity: 10,
        current_enrollment: 10,
        price_ils: mockDecimal(50),
        name: "Yoga class",
      });
      await expect(
        EnrollmentService.enrollStudent("studio-1", "student-1", "class-1")
      ).rejects.toThrow("Course is full");
    });

    it("throws if student is already enrolled", async () => {
      mockPrisma.classes.findUnique.mockResolvedValue({
        max_capacity: 10,
        current_enrollment: 5,
        price_ils: mockDecimal(50),
        name: "Yoga class",
      });
      mockPrisma.enrollments.findFirst.mockResolvedValue({ id: "enroll-1" });

      await expect(
        EnrollmentService.enrollStudent("studio-1", "student-1", "class-1")
      ).rejects.toThrow("Student is already enrolled in this course");
    });

    it("creates enrollment and returns details for valid input", async () => {
      mockPrisma.classes.findUnique.mockResolvedValue({
        max_capacity: 10,
        current_enrollment: 5,
        price_ils: mockDecimal(50),
        name: "Yoga class",
      });
      mockPrisma.enrollments.findFirst.mockResolvedValue(null);
      mockPrisma.enrollments.create.mockResolvedValue({
        id: "new-enroll-1",
        studio_id: "studio-1",
        student_id: "student-1",
        class_id: "class-1",
        status: "ACTIVE",
        payment_status: "PAID",
      });

      const result = await EnrollmentService.enrollStudent(
        "studio-1",
        "student-1",
        "class-1"
      );

      expect(mockPrisma.enrollments.create).toHaveBeenCalled();
      expect(result.courseDetails.name).toBe("Yoga class");
      expect(result.enrollment.id).toBe("new-enroll-1");
    });

    it("creates FREE enrollment as ACTIVE and PAID automatically if price is 0", async () => {
      mockPrisma.classes.findUnique.mockResolvedValue({
        max_capacity: 10,
        current_enrollment: 5,
        price_ils: mockDecimal(0),
        name: "Free class",
      });
      mockPrisma.enrollments.findFirst.mockResolvedValue(null);
      mockPrisma.enrollments.create.mockImplementation((args: any) =>
        Promise.resolve({ id: "free-enroll", ...args.data })
      );

      const result = await EnrollmentService.enrollStudent(
        "studio-1",
        "student-1",
        "class-1",
        "PENDING", // Attempting to set pending
        "PENDING"
      );

      expect(mockPrisma.enrollments.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "ACTIVE", // overridden due to free
            payment_status: "PAID",
          }),
        })
      );
      expect(result.enrollment.status).toBe("ACTIVE");
    });

    it("uses tx client when tx parameter is provided", async () => {
      const mockTx = {
        classes: {
          findUnique: jest.fn().mockResolvedValue({
            max_capacity: 10,
            current_enrollment: 3,
            price_ils: mockDecimal(50),
            name: "Pilates",
          }),
        },
        enrollments: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({
            id: "tx-enroll-1",
            studio_id: "studio-1",
            student_id: "student-1",
            class_id: "class-1",
            status: "PENDING",
            payment_status: "PENDING",
          }),
        },
      };

      await EnrollmentService.enrollStudent(
        "studio-1",
        "student-1",
        "class-1",
        "PENDING",
        "PENDING",
        undefined,
        mockTx as any
      );

      expect(mockTx.enrollments.create).toHaveBeenCalled();
      expect(mockPrisma.enrollments.create).not.toHaveBeenCalled();
    });
  });

  describe("cancelEnrollment", () => {
    it("throws if enrollment is not found", async () => {
      mockPrisma.enrollments.findUnique.mockResolvedValue(null);
      await expect(
        EnrollmentService.cancelEnrollment("invalid-id")
      ).rejects.toThrow("Enrollment not found");
    });

    it("updates enrollment status to CANCELLED", async () => {
      mockPrisma.enrollments.findUnique.mockResolvedValue({
        class_id: "class-1",
        status: "ACTIVE",
      });
      mockPrisma.enrollments.update.mockResolvedValue({
        id: "enroll-1",
        status: "CANCELLED",
      });

      await EnrollmentService.cancelEnrollment("enroll-1");

      expect(mockPrisma.enrollments.update).toHaveBeenCalledWith({
        where: { id: "enroll-1" },
        data: { status: "CANCELLED" },
      });
    });
  });
});
