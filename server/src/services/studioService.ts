import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";

/** Branch details collected by the onboarding form. */
export interface CreateStudioBranchDTO {
  name?: string;
  address?: string;
  city?: string;
  phone_number?: string;
}

export interface CreateStudioDTO {
  name: string;
  description?: string;
  contact_email?: string;
  contact_phone?: string;
  website_url?: string;
  /** Sent by the onboarding form (client/components/admin/Administration). */
  branchData?: CreateStudioBranchDTO;
  // Flat aliases kept for older callers.
  branch_name?: string;
  address?: string;
  city?: string;
  branch_phone?: string;
  schedule_start_hour?: number;
  schedule_end_hour?: number;
}

export class StudioService {
  /** Default room created alongside a branch, mirroring BranchService.create. */
  private static readonly DEFAULT_ROOM = { name: "אולם ראשי", capacity: 20 };

  // Create a new studio + default branch + default room + update user (in a transaction)
  static async createStudio(adminId: string, data: CreateStudioDTO) {
    // 1. Check if user already has a studio
    const existingStudio = await prisma.studios.findFirst({
      where: { admin_id: adminId },
      select: { id: true },
    });

    if (existingStudio) {
      throw new AppError("User already has a studio", 409);
    }

    // The onboarding form nests the branch under `branchData`; older callers
    // passed the same values as flat fields. Accept both so the details the
    // admin typed are never silently dropped.
    const branch: CreateStudioBranchDTO = {
      name: data.branchData?.name || data.branch_name,
      address: data.branchData?.address || data.address,
      city: data.branchData?.city || data.city,
      phone_number:
        data.branchData?.phone_number ||
        data.branch_phone ||
        data.contact_phone,
    };

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
          ...(data.schedule_start_hour !== undefined && {
            schedule_start_hour: data.schedule_start_hour,
          }),
          ...(data.schedule_end_hour !== undefined && {
            schedule_end_hour: data.schedule_end_hour,
          }),
        },
      });

      // Create Default Branch
      const defaultBranch = await tx.branches.create({
        data: {
          studio_id: studio.id,
          name: branch.name || "סניף ראשי",
          address: branch.address || null,
          city: branch.city || null,
          phone_number: branch.phone_number || null,
          is_active: true,
        },
      });

      // Create Default Room — a branch without a room cannot host any class.
      await tx.studio_rooms.create({
        data: {
          studio_id: studio.id,
          branch_id: defaultBranch.id,
          name: StudioService.DEFAULT_ROOM.name,
          capacity: StudioService.DEFAULT_ROOM.capacity,
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

  // Get Studio by Studio ID
  static async getStudioById(studioId: string) {
    const data = await prisma.studios.findUnique({
      where: { id: studioId },
    });

    return data; // Returns null if not found
  }

  /**
   * Resolve the studio a user manages, and repair a broken link on the way.
   *
   * `users.studio_id` is the normal path, but it can be out of sync with
   * reality: an admin invited by a SUPER_ADMIN is created with a NULL
   * studio_id, and deleting a studio nulls the column (ON DELETE SET NULL).
   * When that happens the user still owns their studio through
   * `studios.admin_id`, so fall back to ownership and re-link the user —
   * otherwise the UI offers to create a studio that already exists, and
   * creating it fails with "User already has a studio".
   *
   * Returns null only when the user genuinely has no studio yet.
   */
  static async getStudioForUser(userId: string, studioId?: string | null) {
    if (studioId) {
      const linked = await this.getStudioById(studioId);
      if (linked) return linked;
    }

    const owned = await this.getStudioByAdmin(userId);
    if (!owned) return null;

    await prisma.users.update({
      where: { id: userId },
      data: { studio_id: owned.id },
    });

    return owned;
  }

  // Update Studio
  static async updateStudio(
    studioId: string,
    updates: Partial<CreateStudioDTO>
  ) {
    const data = await prisma.studios.update({
      where: { id: studioId },
      data: updates as any,
    });
    return data;
  }
}
