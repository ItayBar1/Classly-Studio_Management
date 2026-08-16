import { prisma } from "../config/prisma";

export interface BranchDTO {
  name: string;
  address: string;
  city: string;
  phone_number: string;
  is_active?: boolean;
}

export class BranchService {
  static async getAll(studioId: string) {
    const data = await prisma.branches.findMany({
      where: { studio_id: studioId },
      orderBy: { created_at: "asc" },
    });
    return data;
  }

  static async create(studioId: string, data: BranchDTO) {
    // Branch + default room must be created atomically. Without a transaction a
    // failure on the room insert leaves an orphan branch (no room) behind.
    return prisma.$transaction(async (tx) => {
      const branch = await tx.branches.create({
        data: {
          studio_id: studioId,
          ...data,
        },
      });

      // Auto-create default room
      await tx.studio_rooms.create({
        data: {
          studio_id: studioId,
          branch_id: branch.id,
          name: "אולם ראשי",
          capacity: 20,
          is_active: true,
        },
      });

      return branch;
    });
  }

  static async update(
    branchId: string,
    studioId: string,
    data: Partial<BranchDTO>,
  ) {
    const result = await prisma.branches.updateMany({
      where: { id: branchId, studio_id: studioId },
      data: data as any,
    });
    if (result.count === 0) {
      throw new Error("Branch not found or access denied");
    }
    return prisma.branches.findUnique({ where: { id: branchId } });
  }

  static async delete(branchId: string, studioId: string) {
    await prisma.branches.deleteMany({
      where: {
        id: branchId,
        studio_id: studioId,
      },
    });
    return true;
  }
}
