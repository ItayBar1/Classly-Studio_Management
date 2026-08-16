import { EnrollmentService } from "../../src/services/enrollmentService";
import { prisma } from "../../src/config/prisma";

// jest.mock is hoisted before variable declarations, so the mock object must be
// defined inside the factory — not in the outer scope.
jest.mock("../../src/config/prisma", () => ({
  prisma: {
    classes: {
      findFirst: jest.fn(),
    },
    users: {
      findFirst: jest.fn(),
    },
    enrollments: {
      findFirst: jest.fn(),
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
    // Default: the student exists inside the caller's studio. Tenant-isolation
    // tests override this.
    mockPrisma.users.findFirst.mockResolvedValue({ id: "student-1" });
  });

  describe("getCourseInfo", () => {
    it("returns course name and price", async () => {
      mockPrisma.classes.findFirst.mockResolvedValue({
        name: "Yoga",
        price_ils: mockDecimal(120),
      });

      const info = await EnrollmentService.getCourseInfo("class-1", "studio-1");
      expect(info.name).toBe("Yoga");
      expect(Number(info.price)).toBe(120);
      expect(mockPrisma.classes.findFirst).toHaveBeenCalledWith({
        where: { id: "class-1", studio_id: "studio-1" },
        select: { name: true, price_ils: true },
      });
    });

    it("throws 404 if course not found", async () => {
      mockPrisma.classes.findFirst.mockResolvedValue(null);
      await expect(
        EnrollmentService.getCourseInfo("nonexistent", "studio-1")
      ).rejects.toThrow("Course not found");
    });

    it("throws 404 when the caller has no studio context", async () => {
      await expect(
        EnrollmentService.getCourseInfo("class-1")
      ).rejects.toThrow("Course not found");
      expect(mockPrisma.classes.findFirst).not.toHaveBeenCalled();
    });
  });

  describe("enrollStudent", () => {
    it("throws if course is not found", async () => {
      mockPrisma.classes.findFirst.mockResolvedValue(null);
      await expect(
        EnrollmentService.enrollStudent("studio-1", "student-1", "class-1")
      ).rejects.toThrow("Course not found");
    });

    it("scopes the course lookup to the caller's studio", async () => {
      mockPrisma.classes.findFirst.mockResolvedValue(null);
      await expect(
        EnrollmentService.enrollStudent("studio-1", "student-1", "class-1")
      ).rejects.toThrow("Course not found");

      expect(mockPrisma.classes.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "class-1", studio_id: "studio-1" },
        })
      );
    });

    it("throws if the student belongs to another studio", async () => {
      mockPrisma.classes.findFirst.mockResolvedValue({
        max_capacity: 10,
        current_enrollment: 5,
        price_ils: mockDecimal(50),
        name: "Yoga class",
      });
      mockPrisma.users.findFirst.mockResolvedValue(null);

      await expect(
        EnrollmentService.enrollStudent("studio-1", "outsider", "class-1")
      ).rejects.toThrow("Student not found");
      expect(mockPrisma.enrollments.create).not.toHaveBeenCalled();
    });

    it("throws if course is full", async () => {
      mockPrisma.classes.findFirst.mockResolvedValue({
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
      mockPrisma.classes.findFirst.mockResolvedValue({
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
      mockPrisma.classes.findFirst.mockResolvedValue({
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
      mockPrisma.classes.findFirst.mockResolvedValue({
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
          findFirst: jest.fn().mockResolvedValue({
            max_capacity: 10,
            current_enrollment: 3,
            price_ils: mockDecimal(50),
            name: "Pilates",
          }),
        },
        users: {
          findFirst: jest.fn().mockResolvedValue({ id: "student-1" }),
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

  describe("getStudentEnrollments", () => {
    it("scopes the query to the caller's studio", async () => {
      mockPrisma.enrollments.findMany.mockResolvedValue([]);

      await EnrollmentService.getStudentEnrollments("student-1", "studio-1");

      expect(mockPrisma.enrollments.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            student_id: "student-1",
            studio_id: "studio-1",
          }),
        })
      );
    });

    it("returns nothing when the caller has no studio context", async () => {
      const result = await EnrollmentService.getStudentEnrollments("student-1");

      expect(result).toEqual([]);
      expect(mockPrisma.enrollments.findMany).not.toHaveBeenCalled();
    });
  });

  describe("cancelEnrollment", () => {
    it("throws if enrollment is not found", async () => {
      mockPrisma.enrollments.findFirst.mockResolvedValue(null);
      await expect(
        EnrollmentService.cancelEnrollment("invalid-id", "studio-1")
      ).rejects.toThrow("Enrollment not found");
    });

    it("throws for an enrollment owned by another studio", async () => {
      // The scoped lookup finds nothing, so the update never runs.
      mockPrisma.enrollments.findFirst.mockResolvedValue(null);

      await expect(
        EnrollmentService.cancelEnrollment("enroll-1", "other-studio")
      ).rejects.toThrow("Enrollment not found");

      expect(mockPrisma.enrollments.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "enroll-1", studio_id: "other-studio" },
        })
      );
      expect(mockPrisma.enrollments.update).not.toHaveBeenCalled();
    });

    it("updates enrollment status to CANCELLED", async () => {
      mockPrisma.enrollments.findFirst.mockResolvedValue({
        class_id: "class-1",
        status: "ACTIVE",
      });
      mockPrisma.enrollments.update.mockResolvedValue({
        id: "enroll-1",
        status: "CANCELLED",
      });

      await EnrollmentService.cancelEnrollment("enroll-1", "studio-1");

      expect(mockPrisma.enrollments.update).toHaveBeenCalledWith({
        where: { id: "enroll-1" },
        data: { status: "CANCELLED" },
      });
    });
  });
});
