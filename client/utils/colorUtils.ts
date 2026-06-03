export const BRANCH_COLORS = [
  "bg-blue-50 dark:bg-blue-900/20",
  "bg-emerald-50 dark:bg-emerald-900/20",
  "bg-amber-50 dark:bg-amber-900/20",
  "bg-fuchsia-50 dark:bg-fuchsia-900/20",
  "bg-cyan-50 dark:bg-cyan-900/20",
];

export const ROOM_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-fuchsia-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-rose-500",
  "bg-teal-500",
];

export class ColorMapper {
  private branchMap = new Map<string, string>();
  private roomMap = new Map<string, string>();
  private bIndex = 0;
  private rIndex = 0;

  getBranchColor(branchId: string): string {
    if (!this.branchMap.has(branchId)) {
      this.branchMap.set(branchId, BRANCH_COLORS[this.bIndex % BRANCH_COLORS.length]);
      this.bIndex++;
    }
    return this.branchMap.get(branchId)!;
  }

  getRoomColor(roomName: string): string {
    if (!this.roomMap.has(roomName)) {
      this.roomMap.set(roomName, ROOM_COLORS[this.rIndex % ROOM_COLORS.length]);
      this.rIndex++;
    }
    return this.roomMap.get(roomName)!;
  }
}
