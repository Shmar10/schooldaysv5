/* =====================
   CALENDAR SETTINGS
   ===================== */
export const FIRST_DAY = new Date(2025, 7, 12); // Aug 12, 2025
export const LAST_DAY = new Date(2026, 4, 21); // May 21, 2026
export const NON_ATTENDANCE = [
  ["Teacher Institute", 2025, 7, 11, 2025, 7, 11],
  ["Labor Day", 2025, 8, 1, 2025, 8, 1],
  ["Indigenous Peoples Day", 2025, 9, 13, 2025, 9, 13],
  ["Teacher Institute", 2025, 9, 31, 2025, 9, 31],
  ["Thanksgiving Break", 2025, 10, 26, 2025, 10, 28],
  ["Winter Break", 2025, 11, 22, 2026, 0, 2],
  ["Martin Luther King Day", 2026, 0, 19, 2026, 0, 19],
  ["Presidents’ Day", 2026, 1, 16, 2026, 1, 16],
  ["Teacher Institute", 2026, 2, 13, 2026, 2, 13],
  ["Spring Break", 2026, 2, 30, 2026, 3, 3],
];

/* =====================
   BELL SCHEDULES
   ===================== */
/* Default (Mon, Tue, Thu, Fri) */
export const SCHEDULE_DEFAULT = [
  { id: "01", label: "Period 01", start: [8, 10], end: [8, 52], include: true },
  { id: "02", label: "Period 02", start: [8, 57], end: [9, 39], include: true },
  { id: "03", label: "Period 03", start: [9, 44], end: [10, 26], include: true },
  { id: "HR", label: "Homeroom", start: [10, 31], end: [10, 41], include: false },
  { id: "04", label: "Period 04", start: [10, 46], end: [11, 28], include: true },
  { id: "05", label: "Period 05", start: [11, 33], end: [12, 15], include: true },
  { id: "06", label: "Period 06", start: [12, 20], end: [13, 2], include: true },
  { id: "07", label: "Period 07", start: [13, 7], end: [13, 49], include: true },
  { id: "08", label: "Period 08", start: [13, 54], end: [14, 36], include: true },
  { id: "09", label: "Period 09", start: [14, 41], end: [15, 23], include: true },
];
/* Wednesday schedule */
export const SCHEDULE_WED = [
  { id: "01", label: "Period 01", start: [9, 40], end: [10, 14], include: true },
  { id: "02", label: "Period 02", start: [10, 19], end: [10, 52], include: true },
  { id: "03", label: "Period 03", start: [10, 57], end: [11, 31], include: true },
  { id: "04", label: "Period 04", start: [11, 36], end: [12, 10], include: true },
  { id: "05", label: "Period 05", start: [12, 15], end: [12, 49], include: true },
  { id: "06", label: "Period 06", start: [12, 54], end: [13, 28], include: true },
  { id: "07", label: "Period 07", start: [13, 33], end: [14, 7], include: true },
  { id: "08", label: "Period 08", start: [14, 12], end: [14, 45], include: true },
  { id: "09", label: "Period 09", start: [14, 50], end: [15, 23], include: true },
];

export const SCHEDULE_LATE_1010 = [
  { id: "01", label: "Period 01", start: [10, 10], end: [10, 38], include: true },
  { id: "02", label: "Period 02", start: [10, 43], end: [11, 11], include: true },
  { id: "03", label: "Period 03", start: [11, 16], end: [11, 44], include: true },
  { id: "04", label: "Period 04", start: [11, 49], end: [12, 17], include: true },
  { id: "05", label: "Period 05", start: [12, 22], end: [12, 50], include: true },
  { id: "06", label: "Period 06", start: [12, 55], end: [13, 23], include: true },
  { id: "07", label: "Period 07", start: [13, 28], end: [13, 56], include: true },
  { id: "08", label: "Period 08", start: [14, 0o1], end: [14, 29], include: true },
  { id: "09", label: "Period 09", start: [14, 34], end: [15, 0o2], include: true },
];

// If you only want to count certain sections, list period IDs here; otherwise all include:true are counted
export const INCLUDE_ONLY = null;

/* Optional date-specific overrides (e.g., assemblies)
   Example: { '2025-11-05': SCHEDULE_WED }
*/
export const SPECIAL_DATES = {};

// Late Start Wednesdays (YYYY-MM-DD)
export const LATE_WEDNESDAYS = [
  "2025-08-20", "2025-08-27", "2025-09-03", "2025-09-10", "2025-09-17", "2025-09-24",
  "2025-10-01", "2025-10-08", "2025-10-15", "2025-10-22", "2025-10-29",
  "2025-11-05", "2025-11-12", "2025-11-19",
  "2025-12-03", "2025-12-10", "2025-12-17",
  "2026-01-07", "2026-01-14", "2026-01-21", "2026-01-28",
  "2026-02-04", "2026-02-11", "2026-02-18", "2026-02-25",
  "2026-03-04", "2026-03-11", "2026-03-18", "2026-03-25",
  "2026-04-01", "2026-04-08", "2026-04-15", "2026-04-22", "2026-04-29",
  "2026-05-06", "2026-05-13", "2026-05-20"
];

// Late Arrival 10:10 (YYYY-MM-DD)
export const LATE_ARRIVAL_1010 = [
  "2025-09-05",  // Friday, September 5, 2025
  "2026-01-07",  // Wednesday, January 7, 2026
  "2026-05-21"   // Thursday, May 21, 2026 (Last day of school)
];
