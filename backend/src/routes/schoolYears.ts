import { Router } from 'express';
import { z } from 'zod';
import { generateDaysForSchoolYear } from '../services/dayService';
import { prisma } from '../lib/prisma';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { logger } from '../lib/logger';

const router = Router();

const schoolYearSchema = z.object({
  name: z.string().min(1),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)),
  timeZone: z.string().optional().default('America/New_York'),
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
router.post('/', async (req, res) => {
  try {
    const data = schoolYearSchema.parse(req.body);

    // Validate dates
    if (data.startDate >= data.endDate) {
      return res.status(400).json({ error: 'startDate must be before endDate' });
    }

    const schoolYear = await prisma.schoolYear.create({
      data: {
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        timeZone: data.timeZone,
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

    res.status(201).json(updated);
  } catch (error) {
    // Zod errors are automatically handled by errorHandler middleware
    // Re-throw to let the error handler process it
    throw error;
  }
});

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

