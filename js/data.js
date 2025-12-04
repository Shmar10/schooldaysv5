/* =====================
   Data Module - Loads from School Configuration
   ===================== */
import { loadSchoolConfig } from './config-loader.js';

// These will be populated after initConfig() is called
export let FIRST_DAY;
export let LAST_DAY;
export let NON_ATTENDANCE;
export let SCHEDULE_DEFAULT;
export let SCHEDULE_WED;
export let SCHEDULE_LATE_1010;
export let SCHEDULE_EXAM_DEC17;
export let SCHEDULE_EXAM_DEC18;
export let SCHEDULE_EXAM_DEC19;
export let INCLUDE_ONLY;
export let SPECIAL_DATES;
export let LATE_WEDNESDAYS;
export let LATE_ARRIVAL_1010;
export let FINAL_EXAMS;

// Initialize config (call this before using any exports)
export async function initConfig() {
  const config = await loadSchoolConfig();
  
  // Populate all exports from config
  FIRST_DAY = config.firstDay;
  LAST_DAY = config.lastDay;
  NON_ATTENDANCE = config.nonAttendance;
  SCHEDULE_DEFAULT = config.schedules.DEFAULT;
  SCHEDULE_WED = config.schedules.WED_LATE;
  SCHEDULE_LATE_1010 = config.schedules.LATE_ARRIVAL_1010;
  SCHEDULE_EXAM_DEC17 = config.schedules.EXAM_DEC17 || [];
  SCHEDULE_EXAM_DEC18 = config.schedules.EXAM_DEC18 || [];
  SCHEDULE_EXAM_DEC19 = config.schedules.EXAM_DEC19 || [];
  INCLUDE_ONLY = config.includeOnly;
  SPECIAL_DATES = config.specialDates;
  LATE_WEDNESDAYS = config.lateWednesdays;
  LATE_ARRIVAL_1010 = config.lateArrival1010;
  FINAL_EXAMS = config.finalExams;
  
  return config;
}
