# School Configuration System

This directory contains school-specific configuration files. Each school has its own configuration file that defines:

- School branding (name, colors)
- Calendar dates (first day, last day, holidays)
- Bell schedules (regular, late start, exam schedules)
- Special dates and events

## How It Works

1. **Default School**: The app defaults to `nn-vikings` configuration
2. **Switching Schools**: You can switch schools using:
   - URL parameter: `?school=school-name` (e.g., `index.html?school=other-school`)
   - The selection is saved in localStorage for future visits

## Creating a New School Configuration

1. **Copy the template**:
   ```bash
   cp config/school-template.js config/your-school-name.js
   ```

2. **Edit the configuration file** (`config/your-school-name.js`):
   - Update `name`, `fullName`, `shortName` with your school's name
   - Set `themeColor` to your school's color (hex format)
   - Configure `firstDay` and `lastDay` dates
   - Add all non-attendance days to `nonAttendance` array
   - Define all bell schedules in `schedules` object
   - Add special dates, late start days, exam days, etc.

3. **Access the new school**:
   - Visit: `index.html?school=your-school-name`
   - The selection will be remembered for future visits

## Configuration Structure

Each school config file exports a `SCHOOL_CONFIG` object with:

```javascript
{
  name: "Short Name",              // Displayed in header
  fullName: "Full Title",          // Page title
  shortName: "Short",              // Manifest short name
  themeColor: "#6b21a8",          // Primary color
  
  firstDay: new Date(2025, 7, 12), // First day of school
  lastDay: new Date(2026, 4, 21),  // Last day of school
  
  nonAttendance: [                 // Holidays and breaks
    ["Holiday Name", year, month-1, day, endYear, endMonth-1, endDay],
  ],
  
  schedules: {                    // Bell schedules
    DEFAULT: [...],               // Regular schedule
    WED_LATE: [...],              // Wednesday late start
    LATE_ARRIVAL_1010: [...],     // Late arrival schedule
    EXAM_DEC17: [...],            // Exam schedules (optional)
  },
  
  specialDates: {                 // Date-specific overrides
    '2025-12-17': 'EXAM_DEC17',
  },
  
  lateWednesdays: [               // Dates using WED_LATE schedule
    "2025-08-20",
  ],
  
  lateArrival1010: [              // Dates using LATE_ARRIVAL_1010
    "2025-09-05",
  ],
  
  finalExams: [                   // Final exam dates
    "2025-12-17",
  ],
  
  includeOnly: null,              // Filter specific periods (null = all)
  
  markingPeriods: [              // Grading periods
    { "title": "...", "start": "...", "end": "...", "note": "..." },
  ]
}
```

## Schedule Format

Each period in a schedule is defined as:
```javascript
{
  id: "01",                    // Unique period ID
  label: "Period 01",         // Display label
  start: [8, 10],             // [hour, minute] start time
  end: [8, 52],               // [hour, minute] end time
  include: true               // Whether to count in day calculations
}
```

## Examples

- **NN Vikings**: `config/nn-vikings.js` (default)
- **Template**: `config/school-template.js` (copy this for new schools)

## Notes

- All dates use JavaScript Date format: `new Date(year, month-1, day)`
- Month is 0-indexed (0 = January, 11 = December)
- Date strings in arrays use ISO format: `"YYYY-MM-DD"`
- The config system automatically applies theme colors and branding
- Each school's settings are stored separately in localStorage

