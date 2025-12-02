import { DayType } from '@prisma/client';
import { prisma } from '../lib/prisma';

/**
 * Generates day records for a school year date range.
 * All days are initially created as INSTRUCTIONAL with isSchoolDay = true.
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
    days.push({
      date: new Date(current),
      dayType: DayType.INSTRUCTIONAL,
      isSchoolDay: true,
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
 * Both start and end dates are inclusive.
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
  if (fromDate > endDate) {
    return 0;
  }

  const count = await prisma.day.count({
    where: {
      schoolYearId,
      date: {
        gte: fromDate,
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

