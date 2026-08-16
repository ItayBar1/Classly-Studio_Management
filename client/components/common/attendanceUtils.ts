// Shared attendance helpers used by both the instructor and manager views.
// Keeping the classification + section metadata here means the visual grouping
// (green / yellow / red) is defined exactly once.

export type AttendanceBucket = "green" | "yellow" | "red";

/** "session" = reporting status of a class occurrence; "student" = a specific
 *  student's own status per session. */
export type OverviewMode = "session" | "student";

export interface AttendanceItem {
  classId: string;
  className: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  branchId?: string | null;
  branchName?: string;
  instructorId?: string | null;
  instructorName?: string;
  roomName?: string;
  // session mode
  status?: string; // COMPLETED | IN_PROGRESS | MISSING | SCHEDULED
  // student mode
  studentStatus?: string | null; // PRESENT | LATE | EXCUSED | ABSENT
  notes?: string | null;
}

export interface SectionDef {
  bucket: AttendanceBucket;
  title: string;
  /** Per-card status label for this bucket. */
  badge: string;
}

const SECTIONS: Record<OverviewMode, SectionDef[]> = {
  session: [
    { bucket: "green", title: "דווח", badge: "הושלם" },
    { bucket: "yellow", title: "בתהליך", badge: "טיוטה" },
    { bucket: "red", title: "לא דווח", badge: "חסר דיווח" },
  ],
  student: [
    { bucket: "green", title: "נוכח", badge: "נוכח" },
    { bucket: "yellow", title: "איחור / באישור", badge: "איחור" },
    { bucket: "red", title: "נעדר", badge: "נעדר" },
  ],
};

export const sectionsFor = (mode: OverviewMode): SectionDef[] => SECTIONS[mode];

/** Map a single item to its colour bucket + display badge for the given mode. */
export function classifyAttendance(
  item: AttendanceItem,
  mode: OverviewMode
): { bucket: AttendanceBucket; badge: string } {
  if (mode === "session") {
    switch (item.status) {
      case "COMPLETED":
        return { bucket: "green", badge: "הושלם" };
      case "IN_PROGRESS":
        return { bucket: "yellow", badge: "טיוטה" };
      default:
        return { bucket: "red", badge: "חסר דיווח" };
    }
  }
  switch (item.studentStatus) {
    case "PRESENT":
      return { bucket: "green", badge: "נוכח" };
    case "LATE":
      return { bucket: "yellow", badge: "איחור" };
    case "EXCUSED":
      return { bucket: "yellow", badge: "באישור" };
    case "ABSENT":
      return { bucket: "red", badge: "נעדר" };
    default:
      return { bucket: "red", badge: "לא סומן" };
  }
}

/** Tailwind palette per bucket — single source of truth for both views. */
export const BUCKET_THEME: Record<
  AttendanceBucket,
  { header: string; badge: string; card: string; dot: string }
> = {
  green: {
    header:
      "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800/50",
    badge:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400",
    card: "border-emerald-200 hover:border-emerald-300 dark:border-emerald-900/50",
    dot: "bg-emerald-500",
  },
  yellow: {
    header:
      "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800/50",
    badge:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400",
    card: "border-amber-200 hover:border-amber-300 dark:border-amber-900/50",
    dot: "bg-amber-500",
  },
  red: {
    header:
      "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800/50",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400",
    card: "border-rose-200 hover:border-rose-300 dark:border-rose-900/50",
    dot: "bg-rose-500",
  },
};

export const formatAttendanceDate = (dateStr: string): string =>
  dateStr.split("-").reverse().join("/");

/** Attendance can be opened starting this many minutes before the class begins. */
export const ATTENDANCE_LEAD_MINUTES = 15;

/** The moment attendance becomes fillable (class start − lead time). */
export function attendanceOpensAt(date: string, startTime: string): Date {
  const start = new Date(`${date}T${startTime || "00:00"}:00`);
  return new Date(start.getTime() - ATTENDANCE_LEAD_MINUTES * 60_000);
}

/**
 * Whether attendance for this occurrence may be filled now: from 15 minutes
 * before it starts and at any time afterwards (so past sessions stay editable).
 */
export function isAttendanceOpen(
  item: Pick<AttendanceItem, "date" | "startTime">,
  now: Date = new Date()
): boolean {
  return now.getTime() >= attendanceOpensAt(item.date, item.startTime).getTime();
}

/** Stable key for a single occurrence/record. */
export const attendanceItemKey = (item: AttendanceItem, index: number): string =>
  `${item.classId}-${item.date}-${index}`;
