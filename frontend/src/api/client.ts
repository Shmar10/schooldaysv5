import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export type DayType = 'INSTRUCTIONAL' | 'NON_ATTENDANCE' | 'BREAK' | 'SPECIAL_SCHEDULE';
export type UploadType = 'YEAR_CALENDAR' | 'DAILY_SCHEDULE';

export interface SchoolYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  timeZone: string;
  totalSchoolDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface Day {
  id: string;
  date: string;
  dayType: DayType;
  label: string | null;
  notes: string | null;
  isSchoolDay: boolean;
  schoolYearId: string;
  scheduleId: string | null;
  schedule?: Schedule;
  createdAt: string;
  updatedAt: string;
}

export interface Schedule {
  id: string;
  name: string;
  isDefault: boolean;
  schoolYearId: string;
  periods: Period[];
  createdAt: string;
  updatedAt: string;
}

export interface Period {
  name: string;
  startTime: string;
  endTime: string;
}

export interface Break {
  id: string;
  startDate: string;
  endDate: string;
  label: string;
  schoolYearId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Upload {
  id: string;
  type: UploadType;
  originalFilename: string;
  filePath: string;
  parsed: boolean;
  parsedSummary: any;
  schoolYearId: string | null;
  uploadedAt: string;
}

export interface DashboardData {
  schoolYear: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    totalSchoolDays: number;
  };
  metrics: {
    schoolDaysRemaining: number;
    calendarDaysRemaining: number;
    percentSchoolDaysRemaining: number;
    totalSchoolDays: number;
  };
  nextNonAttendanceDay: {
    date: string;
    endDate?: string;
    label: string;
    isToday: boolean;
  } | null;
  isTodayNonAttendance: boolean;
  today: string;
}

