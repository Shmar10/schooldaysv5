import { DayType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { normalizeDate } from '../lib/dateUtils';
import { format } from 'date-fns';

/**
 * Generates day records for a school year date range.
 * Weekdays are initially created as INSTRUCTIONAL with isSchoolDay = true.
 * Weekends are created with isSchoolDay = false.
 * Breaks and non-attendance days should be updated separately.
 */
export async function generateDaysForSchoolYear(
  schoolYearId: string,
  startDate: Date,
  endDate: Date
): Promise<void> {
  const days: Array<{
    date: Date;
    dayType: DayType;
    isSchoolDay: boolean;
    schoolYearId: string;
  }> = [];

  const current = new Date(startDate);
  while (current <= endDate) {
    const dayOfWeek = current.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    days.push({
      date: new Date(current),
      dayType: DayType.INSTRUCTIONAL,
      isSchoolDay: !isWeekend, // Weekends are not school days
      schoolYearId,
    });

    // Move to next day
    current.setDate(current.getDate() + 1);
  }

  // Use upsert to avoid duplicates
  for (const day of days) {
    await prisma.day.upsert({
      where: {
        schoolYearId_date: {
          schoolYearId: day.schoolYearId,
          date: day.date,
        },
      },
      update: {
        dayType: day.dayType,
        isSchoolDay: day.isSchoolDay,
      },
      create: day,
    });
  }
}

/**
 * Determines if a day should be considered a school day based on its dayType.
 * 
 * Logic:
 * - INSTRUCTIONAL: always a school day
 * - SPECIAL_SCHEDULE: can be a school day (if students attend)
 * - NON_ATTENDANCE: never a school day
 * - BREAK: never a school day
 * 
 * The isSchoolDay field in the database is the source of truth, but this function
 * provides the default logic.
 */
export function isDayASchoolDay(dayType: DayType, explicitIsSchoolDay?: boolean): boolean {
  if (explicitIsSchoolDay !== undefined) {
    return explicitIsSchoolDay;
  }

  return dayType === DayType.INSTRUCTIONAL || dayType === DayType.SPECIAL_SCHEDULE;
}

/**
 * Calculates school days remaining from a given date through the end date.
 * Excludes the fromDate (counts only days AFTER the fromDate, matching old behavior).
 * End date is inclusive.
 */
export async function calculateSchoolDaysRemaining(
  schoolYearId: string,
  fromDate: Date
): Promise<number> {
  const schoolYear = await prisma.schoolYear.findUnique({
    where: { id: schoolYearId },
  });

  if (!schoolYear) {
    throw new Error('School year not found');
  }

  const endDate = schoolYear.endDate;
  if (fromDate >= endDate) {
    return 0;
  }

  // Use gt (greater than) instead of gte to exclude today
  // This matches the old behavior: "days after today"
  const count = await prisma.day.count({
    where: {
      schoolYearId,
      date: {
        gt: fromDate,  // Exclude today - only count days AFTER today
        lte: endDate,
      },
      isSchoolDay: true,
    },
  });

  return count;
}

/**
 * Calculates calendar days remaining from a given date through the end date.
 * Both start and end dates are inclusive.
 */
export async function calculateCalendarDaysRemaining(
  schoolYearId: string,
  fromDate: Date
): Promise<number> {
  const schoolYear = await prisma.schoolYear.findUnique({
    where: { id: schoolYearId },
  });

  if (!schoolYear) {
    throw new Error('School year not found');
  }

  const endDate = schoolYear.endDate;
  if (fromDate > endDate) {
    return 0;
  }

  // Calculate difference in days (inclusive)
  const diffTime = endDate.getTime() - fromDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

  return Math.max(0, diffDays);
}

/**
 * Fixes weekends and other data issues for an existing school year:
 * 1. Marks all Saturday and Sunday days as non-school days
 * 2. Ensures BREAK and NON_ATTENDANCE days are marked as non-school days
 * This is useful for fixing data that was created before weekends were properly excluded.
 */
export async function fixWeekendsForSchoolYear(schoolYearId: string): Promise<number> {
  const schoolYear = await prisma.schoolYear.findUnique({
    where: { id: schoolYearId },
  });

  if (!schoolYear) {
    throw new Error('School year not found');
  }

  // Get all days in the school year
  const days = await prisma.day.findMany({
    where: {
      schoolYearId,
    },
  });

  let fixedCount = 0;

  for (const day of days) {
    const dayOfWeek = day.date.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const shouldBeNonSchoolDay = isWeekend || 
                                 day.dayType === DayType.BREAK || 
                                 day.dayType === DayType.NON_ATTENDANCE;
    
    // Fix if the day should be non-school day but is currently marked as school day
    if (shouldBeNonSchoolDay && day.isSchoolDay) {
      await prisma.day.update({
        where: { id: day.id },
        data: {
          isSchoolDay: false,
        },
      });
      fixedCount++;
    }
  }

  // Recalculate total school days
  const totalSchoolDays = await prisma.day.count({
    where: {
      schoolYearId,
      isSchoolDay: true,
    },
  });

  await prisma.schoolYear.update({
    where: { id: schoolYearId },
    data: { totalSchoolDays },
  });

  return fixedCount;
}

/**
 * Fixes date offsets in existing days. This can happen if dates were stored
 * with timezone issues. This function re-normalizes all dates to ensure they're
 * stored correctly as local dates.
 */
export async function fixDateOffsetsForSchoolYear(schoolYearId: string): Promise<number> {
  const schoolYear = await prisma.schoolYear.findUnique({
    where: { id: schoolYearId },
  });

  if (!schoolYear) {
    throw new Error('School year not found');
  }

  // Get all days in the school year
  const days = await prisma.day.findMany({
    where: {
      schoolYearId,
    },
  });

  let fixedCount = 0;

  for (const day of days) {
    // Normalize the date - this ensures it's stored as a local date at midnight
    const normalizedDate = normalizeDate(day.date);
    
    // Check if the date needs to be fixed (if it's different from normalized)
    const originalDateStr = format(day.date, 'yyyy-MM-dd');
    const normalizedDateStr = format(normalizedDate, 'yyyy-MM-dd');
    
    if (originalDateStr !== normalizedDateStr) {
      // Date is off - fix it
      await prisma.day.update({
        where: { id: day.id },
        data: {
          date: normalizedDate,
        },
      });
      fixedCount++;
    }
  }

  // Also fix breaks
  const breaks = await prisma.break.findMany({
    where: {
      schoolYearId,
    },
  });

  for (const breakItem of breaks) {
    const normalizedStart = normalizeDate(breakItem.startDate);
    const normalizedEnd = normalizeDate(breakItem.endDate);
    
    const startNeedsFix = format(breakItem.startDate, 'yyyy-MM-dd') !== format(normalizedStart, 'yyyy-MM-dd');
    const endNeedsFix = format(breakItem.endDate, 'yyyy-MM-dd') !== format(normalizedEnd, 'yyyy-MM-dd');
    
    if (startNeedsFix || endNeedsFix) {
      await prisma.break.update({
        where: { id: breakItem.id },
        data: {
          startDate: normalizedStart,
          endDate: normalizedEnd,
        },
      });
      fixedCount++;
    }
  }

  return fixedCount;
}

