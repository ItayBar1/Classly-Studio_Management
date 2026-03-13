export const DAY_MAP: Record<number, string> = {
  0: "ראשון",
  1: "שני",
  2: "שלישי",
  3: "רביעי",
  4: "חמישי",
  5: "שישי",
  6: "שבת",
};

export const DAYS_ARRAY = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

export const DAY_NAMES_HE: Record<string, string> = {
  'Sun': 'א׳', 'Mon': 'ב׳', 'Tue': 'ג׳', 'Wed': 'ד׳', 'Thu': 'ה׳', 'Fri': 'ו׳', 'Sat': 'ש׳'
};

// Helper function to extract a clean time from either Prisma ISO or a simple string
export const extractTime = (timeValue: string) => {
  if (!timeValue) return "00:00";
  if (timeValue.includes('T')) {
    return new Date(timeValue).toISOString().substring(11, 16);
  }
  return timeValue.substring(0, 5);
};
