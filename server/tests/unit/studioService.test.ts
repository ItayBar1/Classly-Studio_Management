import { StudioService } from "../../src/services/studioService";
import { prisma } from "../../src/config/prisma";
import { AppError } from "../../src/utils/AppError";

jest.mock("../../src/config/prisma", () => {
  const prismaClient: any = {
    studios: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    branches: { create: jest.fn() },
    studio_rooms: { create: jest.fn() },
    users: { update: jest.fn() },
    $queryRaw: jest.fn(),
    $transaction: jest.fn(async (cb: any) => await cb(prismaClient)),
  };
  return { prisma: prismaClient };
});

const prismaMock = prisma as unknown as {
  studios: {
    create: jest.Mock;
    findFirst: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  branches: { create: jest.Mock };
  studio_rooms: { create: jest.Mock };
  users: { update: jest.Mock };
  $queryRaw: jest.Mock;
  $transaction: jest.Mock;
};

const ADMIN_ID = "11111111-1111-1111-1111-111111111111";
const STUDIO_ID = "22222222-2222-2222-2222-222222222222";
const BRANCH_ID = "33333333-3333-3333-3333-333333333333";

describe("StudioService.getStudioForUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the studio the user is linked to", async () => {
    const studio = { id: STUDIO_ID, name: "Studio" };
    prismaMock.studios.findUnique.mockResolvedValue(studio);

    const result = await StudioService.getStudioForUser(ADMIN_ID, STUDIO_ID);

    expect(result).toEqual(studio);
    expect(prismaMock.studios.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.users.update).not.toHaveBeenCalled();
  });

  it("falls back to the studio the user owns when studio_id is null", async () => {
    const owned = { id: STUDIO_ID, name: "Studio", admin_id: ADMIN_ID };
    prismaMock.studios.findFirst.mockResolvedValue(owned);

    const result = await StudioService.getStudioForUser(ADMIN_ID, null);

    expect(result).toEqual(owned);
    expect(prismaMock.studios.findUnique).not.toHaveBeenCalled();
    // The broken link is repaired so the next request takes the fast path.
    expect(prismaMock.users.update).toHaveBeenCalledWith({
      where: { id: ADMIN_ID },
      data: { studio_id: STUDIO_ID },
    });
  });

  it("falls back to ownership when studio_id points at a missing studio", async () => {
    const owned = { id: STUDIO_ID, name: "Studio", admin_id: ADMIN_ID };
    prismaMock.studios.findUnique.mockResolvedValue(null);
    prismaMock.studios.findFirst.mockResolvedValue(owned);

    const result = await StudioService.getStudioForUser(
      ADMIN_ID,
      "44444444-4444-4444-4444-444444444444"
    );

    expect(result).toEqual(owned);
    expect(prismaMock.users.update).toHaveBeenCalled();
  });

  it("returns null when the user has no studio at all", async () => {
    prismaMock.studios.findUnique.mockResolvedValue(null);
    prismaMock.studios.findFirst.mockResolvedValue(null);

    const result = await StudioService.getStudioForUser(ADMIN_ID, null);

    expect(result).toBeNull();
    expect(prismaMock.users.update).not.toHaveBeenCalled();
  });
});

describe("StudioService.createStudio", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.studios.findFirst.mockResolvedValue(null);
    prismaMock.$queryRaw.mockResolvedValue([{ nextval: BigInt(7) }]);
    prismaMock.studios.create.mockResolvedValue({ id: STUDIO_ID });
    prismaMock.branches.create.mockResolvedValue({ id: BRANCH_ID });
    prismaMock.studio_rooms.create.mockResolvedValue({ id: "room" });
    prismaMock.users.update.mockResolvedValue({});
    prismaMock.studios.findUnique.mockResolvedValue({ id: STUDIO_ID });
  });

  it("persists the branch details sent by the onboarding form", async () => {
    await StudioService.createStudio(ADMIN_ID, {
      name: "יוגה סטודיו",
      branchData: {
        name: "תל אביב",
        address: "הרצל 1",
        city: "תל אביב",
        phone_number: "03-1234567",
      },
    });

    expect(prismaMock.branches.create).toHaveBeenCalledWith({
      data: {
        studio_id: STUDIO_ID,
        name: "תל אביב",
        address: "הרצל 1",
        city: "תל אביב",
        phone_number: "03-1234567",
        is_active: true,
      },
    });
  });

  it("still accepts the flat branch fields used by older callers", async () => {
    await StudioService.createStudio(ADMIN_ID, {
      name: "יוגה סטודיו",
      branch_name: "חיפה",
      address: "הנמל 5",
      city: "חיפה",
      branch_phone: "04-7654321",
    });

    expect(prismaMock.branches.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: "חיפה", city: "חיפה" }),
      })
    );
  });

  it("creates a default room for the first branch", async () => {
    await StudioService.createStudio(ADMIN_ID, { name: "יוגה סטודיו" });

    expect(prismaMock.studio_rooms.create).toHaveBeenCalledWith({
      data: {
        studio_id: STUDIO_ID,
        branch_id: BRANCH_ID,
        name: "אולם ראשי",
        capacity: 20,
        is_active: true,
      },
    });
  });

  it("stores the studio's schedule hours", async () => {
    await StudioService.createStudio(ADMIN_ID, {
      name: "יוגה סטודיו",
      schedule_start_hour: 8,
      schedule_end_hour: 21,
    });

    expect(prismaMock.studios.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        schedule_start_hour: 8,
        schedule_end_hour: 21,
      }),
    });
  });

  it("links the admin to the new studio", async () => {
    await StudioService.createStudio(ADMIN_ID, { name: "יוגה סטודיו" });

    expect(prismaMock.users.update).toHaveBeenCalledWith({
      where: { id: ADMIN_ID },
      data: { studio_id: STUDIO_ID },
    });
  });

  it("rejects a second studio with a 409 instead of a 500", async () => {
    prismaMock.studios.findFirst.mockResolvedValue({ id: STUDIO_ID });

    await expect(
      StudioService.createStudio(ADMIN_ID, { name: "שני" })
    ).rejects.toMatchObject({ statusCode: 409 });

    await expect(
      StudioService.createStudio(ADMIN_ID, { name: "שני" })
    ).rejects.toBeInstanceOf(AppError);

    expect(prismaMock.studios.create).not.toHaveBeenCalled();
  });
});
