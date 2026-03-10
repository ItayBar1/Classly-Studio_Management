import { prisma } from "../config/supabase";

export interface RoomDTO {
  branch_id: string;
  name: string;
  capacity: number;
  is_active?: boolean;
}

export class RoomService {
  static async getAll(studioId: string) {
    const data = await prisma.studio_rooms.findMany({
      where: { studio_id: studioId },
      include: {
        branch: {
          select: { name: true },
        },
      },
      orderBy: { name: "asc" },
    });
    return data;
  }

  static async getByBranch(branchId: string) {
    const data = await prisma.studio_rooms.findMany({
      where: { branch_id: branchId },
      orderBy: { name: "asc" },
    });
    return data;
  }

  static async create(studioId: string, data: RoomDTO) {
    const room = await prisma.studio_rooms.create({
      data: {
        studio_id: studioId,
        ...data,
      },
    });
    return room;
  }

  static async update(
    roomId: string,
    studioId: string,
    data: Partial<RoomDTO>,
  ) {
    const result = await prisma.studio_rooms.updateMany({
      where: { id: roomId, studio_id: studioId },
      data: data as any,
    });
    if (result.count === 0) {
      throw new Error("Room not found or access denied");
    }
    return prisma.studio_rooms.findUnique({ where: { id: roomId } });
  }

  static async delete(roomId: string, studioId: string) {
    await prisma.studio_rooms.deleteMany({
      where: {
        id: roomId,
        studio_id: studioId,
      },
    });
    return true;
  }
}
