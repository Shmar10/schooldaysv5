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

    // Calculate metrics
    const schoolDaysRemaining = await calculateSchoolDaysRemaining(schoolYearId, today);
    const calendarDaysRemaining = await calculateCalendarDaysRemaining(schoolYearId, today);
    const totalSchoolDays = schoolYear.totalSchoolDays;
    const percentSchoolDaysRemaining = totalSchoolDays > 0
      ? (schoolDaysRemaining / totalSchoolDays) * 100
      : 0;

    // Find next non-attendance day(s)
    const nextNonAttendanceDays = await prisma.day.findMany({
      where: {
        schoolYearId,
        date: { gte: today },
        OR: [
          { dayType: DayType.NON_ATTENDANCE },
          { dayType: DayType.BREAK },
          { isSchoolDay: false },
        ],
      },
      orderBy: { date: 'asc' },
      take: 10, // Get first 10 to find consecutive groups
    });

    // Group consecutive non-attendance days
    let nextNonAttendance: {
      date: Date;
      endDate?: Date;
      label: string;
      isToday: boolean;
    } | null = null;

    if (nextNonAttendanceDays.length > 0) {
      const first = nextNonAttendanceDays[0];
      const firstDate = new Date(first.date);
      firstDate.setHours(0, 0, 0, 0);

      const isToday = firstDate.getTime() === today.getTime();

      // Check if there are consecutive days
      let endDate: Date | undefined;
      let consecutiveCount = 1;

      for (let i = 1; i < nextNonAttendanceDays.length; i++) {
        const prevDate = new Date(nextNonAttendanceDays[i - 1].date);
        const currDate = new Date(nextNonAttendanceDays[i].date);
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

    // Check if today is a non-attendance day
    const todayRecord = await prisma.day.findUnique({
      where: {
        schoolYearId_date: {
          schoolYearId,
          date: today,
        },
      },
    });

    const isTodayNonAttendance = todayRecord
      ? (!todayRecord.isSchoolDay || 
         todayRecord.dayType === DayType.NON_ATTENDANCE || 
         todayRecord.dayType === DayType.BREAK)
      : false;

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
      },
      nextNonAttendanceDay: nextNonAttendance,
      isTodayNonAttendance,
      today: today.toISOString().split('T')[0],
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

export { router as dashboardRoutes };

