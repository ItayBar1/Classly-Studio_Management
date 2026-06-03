interface TimeBlock {
  id?: string;
  day_of_week: number | null;
  start_time: Date | string;
  end_time: Date | string;
  name?: string;
  branch_id?: string | null;
  [key: string]: any;
}

interface ConflictResult {
  hasConflict: boolean;
  conflictingSession?: TimeBlock;
  hasWarning?: boolean;
  warnings?: string[];
}

/**
 * Extracts minutes since midnight from a Date or a time string ("HH:MM")
 */
const getMinutesSinceMidnight = (timeValue: Date | string): number => {
  if (typeof timeValue === 'string') {
    // If it's a full ISO string (e.g. from Prisma "1970-01-01T09:00:00.000Z")
    if (timeValue.includes('T')) {
      const date = new Date(timeValue);
      return date.getUTCHours() * 60 + date.getUTCMinutes();
    }
    // If it's just "HH:MM"
    const [hours, minutes] = timeValue.split(':').map(Number);
    return hours * 60 + minutes;
  }
  
  // If it's a Date object (Prisma returns Dates mapped to UTC for time fields)
  return timeValue.getUTCHours() * 60 + timeValue.getUTCMinutes();
};

/**
 * Generic algorithm to check if a proposed time block conflicts with any existing time blocks.
 * Overlap logic: startA < endB AND endA > startB
 * Exactly adjacent classes (e.g., 09:00-10:00 and 10:00-11:00) do NOT conflict.
 */
export const checkScheduleConflict = (
  newSession: TimeBlock,
  existingSessions: TimeBlock[]
): ConflictResult => {
  const newStart = getMinutesSinceMidnight(newSession.start_time);
  const newEnd = getMinutesSinceMidnight(newSession.end_time);

  // Validate the new session times
  if (newStart >= newEnd) {
    throw new Error("Start time must be before end time");
  }

  let closestBefore: TimeBlock | null = null;
  let closestBeforeEnd = -1;
  
  let closestAfter: TimeBlock | null = null;
  let closestAfterStart = 24 * 60 + 1; // max minutes

  for (const existing of existingSessions) {
    // Skip if it's the exact same session (for updates)
    if (newSession.id && existing.id && newSession.id === existing.id) {
      continue;
    }

    // Must be on the same day
    if (newSession.day_of_week !== existing.day_of_week) {
      continue;
    }

    const existingStart = getMinutesSinceMidnight(existing.start_time);
    const existingEnd = getMinutesSinceMidnight(existing.end_time);

    // Hard Conflict Check (Time Overlap)
    if (newStart < existingEnd && newEnd > existingStart) {
      return {
        hasConflict: true,
        conflictingSession: existing
      };
    }

    // Identify closest class BEFORE this one
    if (existingEnd <= newStart) {
      if (existingEnd > closestBeforeEnd) {
        closestBeforeEnd = existingEnd;
        closestBefore = existing;
      }
    }

    // Identify closest class AFTER this one
    if (existingStart >= newEnd) {
      if (existingStart < closestAfterStart) {
        closestAfterStart = existingStart;
        closestAfter = existing;
      }
    }
  }

  // Check for cross-branch adjacent warnings
  const warnings: string[] = [];
  let hasWarning = false;

  if (closestBefore && newSession.branch_id && closestBefore.branch_id && newSession.branch_id !== closestBefore.branch_id) {
    hasWarning = true;
    warnings.push("שים לב: המדריך/תלמיד משובץ בסניף אחר מיד לפני שיעור זה.");
  }

  if (closestAfter && newSession.branch_id && closestAfter.branch_id && newSession.branch_id !== closestAfter.branch_id) {
    hasWarning = true;
    warnings.push("שים לב: המדריך/תלמיד משובץ בסניף אחר מיד אחרי שיעור זה.");
  }

  return { hasConflict: false, hasWarning, warnings: Array.from(new Set(warnings)) };
};
