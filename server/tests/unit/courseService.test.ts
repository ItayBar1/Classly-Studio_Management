import { CourseService } from "../../src/services/courseService";
import { prisma } from "../../src/config/prisma";

jest.mock("../../src/config/prisma", () => ({
  prisma: {
    classes: {
      findMany: jest.fn(),
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

const prismaMock = prisma as unknown as {
  classes: { findMany: jest.Mock };
};

const STUDENT_ID = "11111111-1111-1111-1111-111111111111";
const STUDIO_ID = "22222222-2222-2222-2222-222222222222";

describe("CourseService.getAvailableForStudent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns [] and never queries the DB when studioId is missing", async () => {
    const result = await CourseService.getAvailableForStudent(STUDENT_ID);

    expect(result).toEqual([]);
    expect(prismaMock.classes.findMany).not.toHaveBeenCalled();
  });

  it("scopes the query to the student's studio", async () => {
    prismaMock.classes.findMany.mockResolvedValue([
      { id: "c1", max_capacity: 10, current_enrollment: 3 },
    ]);

    await CourseService.getAvailableForStudent(STUDENT_ID, STUDIO_ID);

    expect(prismaMock.classes.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { is_active: true, studio_id: STUDIO_ID },
      })
    );
  });

  it("filters out classes that are already full", async () => {
    prismaMock.classes.findMany.mockResolvedValue([
      { id: "open", max_capacity: 10, current_enrollment: 3 },
      { id: "full", max_capacity: 10, current_enrollment: 10 },
    ]);

    const result = await CourseService.getAvailableForStudent(
      STUDENT_ID,
      STUDIO_ID
    );

    expect(result.map((c: any) => c.id)).toEqual(["open"]);
  });
});
