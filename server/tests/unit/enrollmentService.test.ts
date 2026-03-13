import { EnrollmentService } from '../../src/services/enrollmentService';

const mockPrisma = {
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
};

jest.mock('../../src/config/prisma', () => ({
  prisma: mockPrisma,
}));

jest.mock('../../src/logger', () => ({
  logger: {
    child: () => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }),
  },
}));

describe('EnrollmentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('enrollStudent', () => {
    it('throws if course is not found', async () => {
      mockPrisma.classes.findUnique.mockResolvedValue(null);
      await expect(
        EnrollmentService.enrollStudent('studio-1', 'student-1', 'class-1')
      ).rejects.toThrow('Course not found');
    });

    it('throws if course is full', async () => {
      mockPrisma.classes.findUnique.mockResolvedValue({
        max_capacity: 10,
        current_enrollment: 10,
        price_ils: 50,
        name: 'Yoga class',
      });
      await expect(
        EnrollmentService.enrollStudent('studio-1', 'student-1', 'class-1')
      ).rejects.toThrow('Course is full');
    });

    it('throws if student is already enrolled', async () => {
      mockPrisma.classes.findUnique.mockResolvedValue({
        max_capacity: 10,
        current_enrollment: 5,
        price_ils: 50,
        name: 'Yoga class',
      });
      mockPrisma.enrollments.findFirst.mockResolvedValue({ id: 'enroll-1' });

      await expect(
        EnrollmentService.enrollStudent('studio-1', 'student-1', 'class-1')
      ).rejects.toThrow('Student is already enrolled in this course');
    });

    it('creates enrollment and returns details for valid input', async () => {
      mockPrisma.classes.findUnique.mockResolvedValue({
        max_capacity: 10,
        current_enrollment: 5,
        price_ils: 50,
        name: 'Yoga class',
      });
      mockPrisma.enrollments.findFirst.mockResolvedValue(null);
      mockPrisma.enrollments.create.mockResolvedValue({
        id: 'new-enroll-1',
        studio_id: 'studio-1',
        student_id: 'student-1',
        class_id: 'class-1',
        status: 'ACTIVE',
        payment_status: 'PAID',
      });

      const result = await EnrollmentService.enrollStudent(
        'studio-1',
        'student-1',
        'class-1'
      );

      expect(mockPrisma.enrollments.create).toHaveBeenCalled();
      expect(result.courseDetails.name).toBe('Yoga class');
      expect(result.enrollment.id).toBe('new-enroll-1');
    });

    it('creates FREE enrollment as ACTIVE and PAID automatically if price is 0', async () => {
      mockPrisma.classes.findUnique.mockResolvedValue({
        max_capacity: 10,
        current_enrollment: 5,
        price_ils: 0,
        name: 'Free class',
      });
      mockPrisma.enrollments.findFirst.mockResolvedValue(null);
      mockPrisma.enrollments.create.mockImplementation((args) => Promise.resolve({ id: 'free-enroll', ...args.data }));

      const result = await EnrollmentService.enrollStudent(
        'studio-1',
        'student-1',
        'class-1',
        'PENDING', // Attempting to set pending
        'PENDING'
      );

      expect(mockPrisma.enrollments.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'ACTIVE', // overridden due to free
            payment_status: 'PAID',
          }),
        })
      );
      expect(result.enrollment.status).toBe('ACTIVE');
    });
  });

  describe('cancelEnrollment', () => {
    it('throws if enrollment is not found', async () => {
      mockPrisma.enrollments.findUnique.mockResolvedValue(null);
      await expect(EnrollmentService.cancelEnrollment('invalid-id')).rejects.toThrow('Enrollment not found');
    });

    it('updates enrollment status to CANCELLED', async () => {
      mockPrisma.enrollments.findUnique.mockResolvedValue({ class_id: 'class-1', status: 'ACTIVE' });
      mockPrisma.enrollments.update.mockResolvedValue({ id: 'enroll-1', status: 'CANCELLED' });

      await EnrollmentService.cancelEnrollment('enroll-1');

      expect(mockPrisma.enrollments.update).toHaveBeenCalledWith({
        where: { id: 'enroll-1' },
        data: { status: 'CANCELLED' },
      });
    });
  });
});
