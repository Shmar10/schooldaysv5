/**
 * Parses a date string in YYYY-MM-DD format as a local date (not UTC).
 * This prevents timezone issues where "2025-12-02" might be interpreted
 * as the previous day in some timezones.
 * 
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Date object in local timezone, normalized to midnight
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  // month is 0-indexed in Date constructor, so subtract 1
  // Create date in local timezone and normalize to midnight
  const date = new Date(year, month - 1, day, 0, 0, 0, 0);
  return date;
}

/**
 * Normalizes a Date object to midnight in local timezone.
 * Useful for comparing dates without time components.
 */
export function normalizeDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

