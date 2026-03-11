import { prisma } from "../config/prisma";

export interface CreateStudioDTO {
  name: string;
  description?: string;
  contact_email?: string;
  contact_phone?: string;
  website_url?: string;
}

export class StudioService {
  // Create a new studio + default branch + update user (in a transaction)
  static async createStudio(adminId: string, data: CreateStudioDTO) {
    // 1. Check if user already has a studio
    const existingStudio = await prisma.studios.findFirst({
      where: { admin_id: adminId },
      select: { id: true },
    });

    if (existingStudio) {
      throw new Error("User already has a studio");
    }

    // 2. Use a Prisma transaction to handle the entire operation atomically
    const result = await prisma.$transaction(async (tx) => {
      // Generate serial number
      const seqResult = await tx.$queryRaw<
        [{ nextval: bigint }]
      >`SELECT nextval('public.studio_serial_sequence')`;
      const seqNum = seqResult[0].nextval;
      const datePrefix = new Date()
        .toISOString()
        .slice(2, 10)
        .replace(/-/g, "")
        .slice(0, 6);
      const serialNumber = `${datePrefix}-${String(seqNum).padStart(6, "0")}`;

      // Create Studio
      const studio = await tx.studios.create({
        data: {
          admin_id: adminId,
          name: data.name,
          serial_number: serialNumber,
          description: data.description || null,
          contact_email: data.contact_email || null,
          contact_phone: data.contact_phone || null,
          website_url: data.website_url || null,
        },
      });

      // Create Default Branch
      await tx.branches.create({
        data: {
          studio_id: studio.id,
          name: "Main Branch",
          is_active: true,
        },
      });

      // Update Admin User to link to this studio
      await tx.users.update({
        where: { id: adminId },
        data: { studio_id: studio.id },
      });

      return studio;
    });

    // Fetch the full studio record
    const studio = await prisma.studios.findUnique({
      where: { id: result.id },
    });

    return studio;
  }

  // Get Studio by Admin ID
  static async getStudioByAdmin(adminId: string) {
    const data = await prisma.studios.findFirst({
      where: { admin_id: adminId },
    });

    return data; // Returns null if not found
  }

  // Update Studio
  static async updateStudio(
    studioId: string,
    updates: Partial<CreateStudioDTO>,
  ) {
    const data = await prisma.studios.update({
      where: { id: studioId },
      data: updates as any,
    });
    return data;
  }
}
