import { Router } from 'express';
import { z } from 'zod';
import { generateDaysForSchoolYear, fixWeekendsForSchoolYear, fixDateOffsetsForSchoolYear } from '../services/dayService';
import { prisma } from '../lib/prisma';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { logger } from '../lib/logger';
import { parseLocalDate } from '../lib/dateUtils';

const router = Router();

const schoolYearSchema = z.object({
  name: z.string().min(1),
  startDate: z.string().transform((str) => parseLocalDate(str)),
  endDate: z.string().transform((str) => parseLocalDate(str)),
  timeZone: z.string().optional().default('America/New_York'),
  primaryColor: z.string().optional().nullable().transform((val) => val === '' ? null : val),
  secondaryColor: z.string().optional().nullable().transform((val) => val === '' ? null : val),
});

// GET /api/school-years - List all school years
router.get('/', asyncHandler(async (req, res) => {
  const requestId = (req as any).requestId;
  
  const schoolYears = await prisma.schoolYear.findMany({
    orderBy: { startDate: 'desc' },
    include: {
      _count: {
        select: { days: true, schedules: true, breaks: true },
      },
    },
  });
  
  logger.info('Fetched school years', { count: schoolYears.length }, requestId);
  res.json(schoolYears);
}));

// GET /api/school-years/:id - Get single school year
router.get('/:id', asyncHandler(async (req, res) => {
  const requestId = (req as any).requestId;
  const { id } = req.params;
  
  const schoolYear = await prisma.schoolYear.findUnique({
    where: { id },
    include: {
      schedules: true,
      breaks: true,
      _count: {
        select: { days: true },
      },
    },
  });

  if (!schoolYear) {
    throw new AppError('School year not found', 404);
  }

  res.json(schoolYear);
}));

// POST /api/school-years - Create new school year
router.post('/', asyncHandler(async (req, res) => {
  const requestId = (req as any).requestId;
  logger.info('Creating school year', { body: req.body }, requestId);
  
  const data = schoolYearSchema.parse(req.body);
  
  logger.info('Parsed school year data', { 
    name: data.name,
    startDate: data.startDate,
    endDate: data.endDate,
    timeZone: data.timeZone,
    primaryColor: data.primaryColor,
    secondaryColor: data.secondaryColor,
  }, requestId);

  // Validate dates
  if (data.startDate >= data.endDate) {
    throw new AppError('startDate must be before endDate', 400);
  }

    const schoolYear = await prisma.schoolYear.create({
      data: {
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        timeZone: data.timeZone,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
      },
    });

    // Generate initial days for the school year
    await generateDaysForSchoolYear(schoolYear.id, data.startDate, data.endDate);

    // Recalculate total school days
    const totalSchoolDays = await prisma.day.count({
      where: {
        schoolYearId: schoolYear.id,
        isSchoolDay: true,
      },
    });

    const updated = await prisma.schoolYear.update({
      where: { id: schoolYear.id },
      data: { totalSchoolDays },
    });

    logger.info('Created school year', { schoolYearId: schoolYear.id }, requestId);
    res.status(201).json(updated);
}));

// PUT /api/school-years/:id - Update school year
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = schoolYearSchema.partial().parse(req.body);

    const existing = await prisma.schoolYear.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'School year not found' });
    }

    // If dates changed, regenerate days
    const datesChanged = (data.startDate && data.startDate.getTime() !== existing.startDate.getTime()) ||
                         (data.endDate && data.endDate.getTime() !== existing.endDate.getTime());

    const startDate = data.startDate || existing.startDate;
    const endDate = data.endDate || existing.endDate;

    if (startDate >= endDate) {
      return res.status(400).json({ error: 'startDate must be before endDate' });
    }

    const schoolYear = await prisma.schoolYear.update({
      where: { id },
      data: {
        name: data.name,
        startDate,
        endDate,
        timeZone: data.timeZone,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
      },
    });

    if (datesChanged) {
      // Regenerate days
      await generateDaysForSchoolYear(id, startDate, endDate);

      // Recalculate total school days
      const totalSchoolDays = await prisma.day.count({
        where: {
          schoolYearId: id,
          isSchoolDay: true,
        },
      });

      await prisma.schoolYear.update({
        where: { id },
        data: { totalSchoolDays },
      });
    }

    const updated = await prisma.schoolYear.findUnique({
      where: { id },
      include: {
        schedules: true,
        breaks: true,
      },
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error updating school year:', error);
    res.status(500).json({ error: 'Failed to update school year' });
  }
});

// POST /api/school-years/:id/fix-weekends - Fix weekends for existing school year
router.post('/:id/fix-weekends', asyncHandler(async (req, res) => {
  const requestId = (req as any).requestId;
  const { id } = req.params;
  
  const schoolYear = await prisma.schoolYear.findUnique({ where: { id } });
  if (!schoolYear) {
    throw new AppError('School year not found', 404);
  }
  
  // First fix date offsets, then fix weekends
  const dateOffsetCount = await fixDateOffsetsForSchoolYear(id);
  const weekendCount = await fixWeekendsForSchoolYear(id);
  
  logger.info('Fixed dates and weekends for school year', { 
    schoolYearId: id, 
    dateOffsetCount,
    weekendCount 
  }, requestId);
  
  const updated = await prisma.schoolYear.findUnique({
    where: { id },
    include: {
      schedules: true,
      breaks: true,
    },
  });
  
  res.json({ 
    ...updated,
    fixedDateOffsets: dateOffsetCount,
    fixedWeekendDays: weekendCount,
  });
}));

// DELETE /api/school-years/:id - Delete school year
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.schoolYear.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting school year:', error);
    res.status(500).json({ error: 'Failed to delete school year' });
  }
});

export { router as schoolYearRoutes };

