import { CourseService } from "../../src/services/courseService";
import { prisma } from "../../src/config/prisma";

jest.mock("../../src/config/prisma", () => ({
  prisma: {
    classes: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
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

const prismaMock = prisma as unknown as {
  classes: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
};

const STUDIO_ID = "11111111-1111-1111-1111-111111111111";
const BRANCH_ID = "22222222-2222-2222-2222-222222222222";
const ROOM_ID = "33333333-3333-3333-3333-333333333333";
const CLASS_ID = "44444444-4444-4444-4444-444444444444";

const baseCourse = {
  studio_id: STUDIO_ID,
  branch_id: BRANCH_ID,
  name: "יוגה",
  day_of_week: 0,
  start_time: "09:00",
  end_time: "10:00",
  max_capacity: 20,
  price_ils: 0,
};

/** The room-conflict lookup is the second findMany call (after the instructor one). */
const roomLookupArgs = () => prismaMock.classes.findMany.mock.calls.at(-1)?.[0];

describe("CourseService.createCourse room linking", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.classes.findMany.mockResolvedValue([]);
    prismaMock.classes.create.mockResolvedValue({ id: CLASS_ID });
  });

  it("persists room_id so the schedule can key off the FK", async () => {
    await CourseService.createCourse({
      ...baseCourse,
      location_room: "אולם 1",
      room_id: ROOM_ID,
    });

    expect(prismaMock.classes.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        room_id: ROOM_ID,
        location_room: "אולם 1",
      }),
    });
  });

  it("checks room conflicts by room_id when one is supplied", async () => {
    await CourseService.createCourse({
      ...baseCourse,
      location_room: "אולם 1",
      room_id: ROOM_ID,
    });

    expect(roomLookupArgs().where).toEqual(
      expect.objectContaining({ room_id: ROOM_ID })
    );
    expect(roomLookupArgs().where).not.toHaveProperty("location_room");
  });

  it("falls back to the room name when no room_id is supplied", async () => {
    await CourseService.createCourse({
      ...baseCourse,
      location_room: "אולם ראשי",
    });

    expect(roomLookupArgs().where).toEqual(
      expect.objectContaining({ location_room: "אולם ראשי" })
    );
    expect(roomLookupArgs().where).not.toHaveProperty("room_id");
  });
});

describe("CourseService.updateCourse room linking", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.classes.findMany.mockResolvedValue([]);
    prismaMock.classes.update.mockResolvedValue({ id: CLASS_ID });
    prismaMock.classes.findUnique.mockResolvedValue({
      id: CLASS_ID,
      studio_id: STUDIO_ID,
      branch_id: BRANCH_ID,
      day_of_week: 0,
      start_time: new Date("1970-01-01T09:00:00.000Z"),
      end_time: new Date("1970-01-01T10:00:00.000Z"),
      instructor_id: null,
      location_room: "אולם ראשי",
      room_id: null,
    });
  });

  it("links a legacy class to a room when one is chosen", async () => {
    await CourseService.updateCourse(CLASS_ID, {
      location_room: "אולם 1",
      room_id: ROOM_ID,
    });

    expect(prismaMock.classes.update).toHaveBeenCalledWith({
      where: { id: CLASS_ID },
      data: expect.objectContaining({ room_id: ROOM_ID }),
    });
  });

  it("keeps the existing room_id when the update does not mention it", async () => {
    prismaMock.classes.findUnique.mockResolvedValue({
      id: CLASS_ID,
      studio_id: STUDIO_ID,
      branch_id: BRANCH_ID,
      day_of_week: 0,
      start_time: new Date("1970-01-01T09:00:00.000Z"),
      end_time: new Date("1970-01-01T10:00:00.000Z"),
      instructor_id: null,
      location_room: "אולם 1",
      room_id: ROOM_ID,
    });

    await CourseService.updateCourse(CLASS_ID, { name: "יוגה מתקדמים" });

    // The conflict lookup still scopes to the room the class already sits in.
    expect(roomLookupArgs().where).toEqual(
      expect.objectContaining({ room_id: ROOM_ID })
    );
  });
});
