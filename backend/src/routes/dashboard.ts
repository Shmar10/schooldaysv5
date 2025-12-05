import { Router } from 'express';
import { DayType } from '@prisma/client';
import { calculateSchoolDaysRemaining, calculateCalendarDaysRemaining } from '../services/dayService';
import { prisma } from '../lib/prisma';

const router = Router();

// GET /api/dashboard/:schoolYearId
router.get('/:schoolYearId', async (req, res) => {
  try {
    const { schoolYearId } = req.params;
    const { timezone } = req.query;

    const schoolYear = await prisma.schoolYear.findUnique({
      where: { id: schoolYearId },
    });

    if (!schoolYear) {
      return res.status(404).json({ error: 'School year not found' });
    }

    // Get today's date in the school year's timezone
    // For simplicity, we'll use the server's timezone or provided timezone
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Also normalize the date to ensure proper comparison (set to local midnight)
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDay = today.getDate();
    const normalizedToday = new Date(todayYear, todayMonth, todayDay, 0, 0, 0, 0);

    // Calculate metrics
    const schoolDaysRemaining = await calculateSchoolDaysRemaining(schoolYearId, normalizedToday);
    const calendarDaysRemaining = await calculateCalendarDaysRemaining(schoolYearId, normalizedToday);
    const totalSchoolDays = schoolYear.totalSchoolDays;
    const percentSchoolDaysRemaining = totalSchoolDays > 0
      ? (schoolDaysRemaining / totalSchoolDays) * 100
      : 0;

    // Find next non-attendance day(s) - exclude weekends as they're automatically non-school days
    const nextNonAttendanceDays = await prisma.day.findMany({
      where: {
        schoolYearId,
        date: { gte: normalizedToday },
        OR: [
          { dayType: DayType.NON_ATTENDANCE },
          { dayType: DayType.BREAK },
          { isSchoolDay: false },
        ],
      },
      orderBy: { date: 'asc' },
      take: 20, // Get more to find consecutive groups and filter weekends
    });

    // Filter out weekends - they're automatically non-school days, not special non-attendance days
    const filteredNonAttendanceDays = nextNonAttendanceDays.filter(day => {
      const dayDate = new Date(day.date);
      const dayOfWeek = dayDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      // Only include if it's explicitly marked as non-attendance/break OR it's a weekday that's not a school day
      return !isWeekend && (day.dayType === DayType.NON_ATTENDANCE || day.dayType === DayType.BREAK || !day.isSchoolDay);
    });

    // Group consecutive non-attendance days
    let nextNonAttendance: {
      date: Date;
      endDate?: Date;
      label: string;
      isToday: boolean;
    } | null = null;

    if (filteredNonAttendanceDays.length > 0) {
      const first = filteredNonAttendanceDays[0];
      const firstDate = new Date(first.date);
      firstDate.setHours(0, 0, 0, 0);

      const isToday = firstDate.getTime() === normalizedToday.getTime();

      // Check if there are consecutive days
      let endDate: Date | undefined;
      let consecutiveCount = 1;

      for (let i = 1; i < filteredNonAttendanceDays.length; i++) {
        const prevDate = new Date(filteredNonAttendanceDays[i - 1].date);
        const currDate = new Date(filteredNonAttendanceDays[i].date);
        const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          consecutiveCount++;
          endDate = currDate;
        } else {
          break;
        }
      }

      const label = first.label || 
                   (first.dayType === DayType.BREAK ? 'Break' : 'Non-attendance day');

      nextNonAttendance = {
        date: firstDate,
        endDate: endDate,
        label,
        isToday,
      };
    }

    // Check if today is a non-attendance day and get today's schedule
    const todayRecord = await prisma.day.findUnique({
      where: {
        schoolYearId_date: {
          schoolYearId,
          date: normalizedToday,
        },
      },
      include: {
        schedule: true,
      },
    });

    const isTodayNonAttendance = todayRecord
      ? (!todayRecord.isSchoolDay || 
         todayRecord.dayType === DayType.NON_ATTENDANCE || 
         todayRecord.dayType === DayType.BREAK)
      : false;

    // Get today's schedule (from day record or default schedule)
    let todaySchedule = null;
    if (todayRecord?.schedule) {
      todaySchedule = todayRecord.schedule;
    } else {
      // Get default schedule for the school year
      const defaultSchedule = await prisma.schedule.findFirst({
        where: {
          schoolYearId,
          isDefault: true,
        },
      });
      if (defaultSchedule) {
        todaySchedule = defaultSchedule;
      }
    }

    // Calculate current period and remaining periods
    let currentPeriodIndex: number | null = null;
    let remainingPeriods = 0;
    const now = new Date();
    const isTodaySchoolDay = todayRecord?.isSchoolDay ?? true;
    
    if (todaySchedule && todaySchedule.periods && Array.isArray(todaySchedule.periods) && !isTodayNonAttendance && isTodaySchoolDay) {
      const periods = todaySchedule.periods as Array<{ name: string; startTime: string; endTime: string }>;
      
      // Parse time strings (format: "HH:mm" or "HH:mm:ss")
      const parseTime = (timeStr: string): Date => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const periodTime = new Date(normalizedToday);
        periodTime.setHours(hours, minutes || 0, 0, 0);
        return periodTime;
      };

      for (let i = 0; i < periods.length; i++) {
        const period = periods[i];
        const startTime = parseTime(period.startTime);
        const endTime = parseTime(period.endTime);
        
        // Check if we're currently in this period
        if (now >= startTime && now < endTime) {
          currentPeriodIndex = i;
        }
        
        // Count periods that haven't ended yet
        if (now < endTime) {
          remainingPeriods++;
        }
      }
    }

    // Get next break
    const nextBreak = await prisma.break.findFirst({
      where: {
        schoolYearId,
        endDate: { gte: today },
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    res.json({
      schoolYear: {
        id: schoolYear.id,
        name: schoolYear.name,
        startDate: schoolYear.startDate,
        endDate: schoolYear.endDate,
        totalSchoolDays,
      },
      metrics: {
        schoolDaysRemaining,
        calendarDaysRemaining,
        percentSchoolDaysRemaining: Math.round(percentSchoolDaysRemaining * 10) / 10,
        totalSchoolDays,
        percentComplete: Math.round((100 - percentSchoolDaysRemaining) * 10) / 10,
      },
      nextNonAttendanceDay: nextNonAttendance,
      isTodayNonAttendance,
      today: normalizedToday.toISOString().split('T')[0],
      todayDay: todayRecord ? {
        date: todayRecord.date,
        dayType: todayRecord.dayType,
        label: todayRecord.label,
        isSchoolDay: todayRecord.isSchoolDay,
      } : null,
      todaySchedule: todaySchedule ? {
        id: todaySchedule.id,
        name: todaySchedule.name,
        periods: todaySchedule.periods,
      } : null,
      currentPeriodIndex,
      remainingPeriods,
      nextBreak: nextBreak ? {
        id: nextBreak.id,
        startDate: nextBreak.startDate,
        endDate: nextBreak.endDate,
        label: nextBreak.label,
      } : null,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

export { router as dashboardRoutes };

