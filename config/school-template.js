/* =====================
   School Configuration Template
   Copy this file and rename it for your school (e.g., school-name.js)
   Then update all the values below with your school's information.
   ===================== */

export const SCHOOL_CONFIG = {
  // School branding
  name: "School Name",                    // Short name displayed in header
  fullName: "School Name — School Days & Periods",  // Full title
  shortName: "School Name",               // Short name for manifest
  themeColor: "#6b21a8",                 // Primary theme color (hex)
  
  // Calendar settings
  firstDay: new Date(2025, 7, 12),       // First day of school (year, month-1, day)
  lastDay: new Date(2026, 4, 21),        // Last day of school (year, month-1, day)
  
  // Non-attendance days
  // Format: [name, startYear, startMonth-1, startDay, endYear, endMonth-1, endDay]
  nonAttendance: [
    // ["Holiday Name", 2025, 7, 11, 2025, 7, 11],  // Single day
    // ["Break Name", 2025, 11, 22, 2026, 0, 2],    // Multi-day range
  ],
  
  // Bell schedules
  // Each schedule is an array of periods with: id, label, start [hour, minute], end [hour, minute], include (boolean)
  schedules: {
    DEFAULT: [
      // { id: "01", label: "Period 01", start: [8, 10], end: [8, 52], include: true },
      // Add your default schedule periods here
    ],
    WED_LATE: [
      // { id: "01", label: "Period 01", start: [9, 40], end: [10, 14], include: true },
      // Add your Wednesday late start schedule here (if applicable)
    ],
    LATE_ARRIVAL_1010: [
      // { id: "01", label: "Period 01", start: [10, 10], end: [10, 38], include: true },
      // Add your late arrival schedule here (if applicable)
    ],
    // Add more schedule types as needed (e.g., EXAM schedules)
  },
  
  // Special dates (date-specific schedule overrides)
  // Format: 'YYYY-MM-DD': 'SCHEDULE_KEY'
  specialDates: {
    // '2025-12-17': 'EXAM_DEC17',
  },
  
  // Late Start Wednesdays (YYYY-MM-DD)
  // List all dates that use the WED_LATE schedule
  lateWednesdays: [
    // "2025-08-20", "2025-08-27",
  ],
  
  // Late Arrival dates (YYYY-MM-DD)
  // List all dates that use the LATE_ARRIVAL_1010 schedule
  lateArrival1010: [
    // "2025-09-05",
  ],
  
  // Final Exam Days (YYYY-MM-DD)
  finalExams: [
    // "2025-12-17", "2025-12-18", "2025-12-19",
  ],
  
  // Period inclusion filter (null = include all with include:true)
  // If you want to count only specific periods, list their IDs here: ["01", "02", "03"]
  includeOnly: null,
  
  // Marking periods / grading periods
  markingPeriods: [
    // { "title": "Progress Report 1", "start": "2025-08-12", "end": "2025-09-11", "note": "(22 days)" },
  ]
};

