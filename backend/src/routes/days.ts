import { Router } from 'express';
import { DayType } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const router = Router();

const daySchema = z.object({
  date: z.string().transform((str) => new Date(str)),
  dayType: z.nativeEnum(DayType),
  label: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isSchoolDay: z.boolean().optional(),
  scheduleId: z.string().optional().nullable(),
});

const bulkUpdateSchema = z.object({
  schoolYearId: z.string(),
  updates: z.array(z.object({
    date: z.string().transform((str) => new Date(str)),
    dayType: z.nativeEnum(DayType).optional(),
    label: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    isSchoolDay: z.boolean().optional(),
    scheduleId: z.string().optional().nullable(),
  })),
});

// GET /api/days?schoolYearId=xxx&startDate=xxx&endDate=xxx
router.get('/', async (req, res) => {
  try {
    const { schoolYearId, startDate, endDate } = req.query;

    if (!schoolYearId) {
      return res.status(400).json({ error: 'schoolYearId is required' });
    }

    const where: any = { schoolYearId: schoolYearId as string };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.date.lte = new Date(endDate as string);
      }
    }

    const days = await prisma.day.findMany({
      where,
      include: {
        schedule: true,
      },
      orderBy: { date: 'asc' },
    });

    res.json(days);
  } catch (error) {
    console.error('Error fetching days:', error);
    res.status(500).json({ error: 'Failed to fetch days' });
  }
});

// GET /api/days/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const day = await prisma.day.findUnique({
      where: { id },
      include: {
        schedule: true,
        schoolYear: true,
      },
    });

    if (!day) {
      return res.status(404).json({ error: 'Day not found' });
    }

    res.json(day);
  } catch (error) {
    console.error('Error fetching day:', error);
    res.status(500).json({ error: 'Failed to fetch day' });
  }
});

// POST /api/days - Create or update a day
router.post('/', async (req, res) => {
  try {
    const data = daySchema.parse(req.body);
    const { schoolYearId } = req.body;

    if (!schoolYearId) {
      return res.status(400).json({ error: 'schoolYearId is required' });
    }

    // Verify school year exists and date is within range
    const schoolYear = await prisma.schoolYear.findUnique({
      where: { id: schoolYearId },
    });

    if (!schoolYear) {
      return res.status(404).json({ error: 'School year not found' });
    }

    if (data.date < schoolYear.startDate || data.date > schoolYear.endDate) {
      return res.status(400).json({ error: 'Date is outside school year range' });
    }

    // Determine isSchoolDay if not explicitly provided
    let isSchoolDay = data.isSchoolDay;
    if (isSchoolDay === undefined) {
      isSchoolDay = data.dayType === DayType.INSTRUCTIONAL || 
                    data.dayType === DayType.SPECIAL_SCHEDULE;
    }

    const day = await prisma.day.upsert({
      where: {
        schoolYearId_date: {
          schoolYearId,
          date: data.date,
        },
      },
      update: {
        dayType: data.dayType,
        label: data.label,
        notes: data.notes,
        isSchoolDay,
        scheduleId: data.scheduleId,
      },
      create: {
        date: data.date,
        dayType: data.dayType,
        label: data.label,
        notes: data.notes,
        isSchoolDay,
        scheduleId: data.scheduleId,
        schoolYearId,
      },
      include: {
        schedule: true,
      },
    });

    // Recalculate total school days for the school year
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

    res.status(201).json(day);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error creating/updating day:', error);
    res.status(500).json({ error: 'Failed to create/update day' });
  }
});

// PUT /api/days/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = daySchema.partial().parse(req.body);

    const existing = await prisma.day.findUnique({
      where: { id },
      include: { schoolYear: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Day not found' });
    }

    // If date changed, verify it's still in range
    if (data.date) {
      const schoolYear = existing.schoolYear;
      if (data.date < schoolYear.startDate || data.date > schoolYear.endDate) {
        return res.status(400).json({ error: 'Date is outside school year range' });
      }
    }

    const day = await prisma.day.update({
      where: { id },
      data: {
        date: data.date,
        dayType: data.dayType,
        label: data.label,
        notes: data.notes,
        isSchoolDay: data.isSchoolDay,
        scheduleId: data.scheduleId,
      },
      include: {
        schedule: true,
      },
    });

    // Recalculate total school days
    const totalSchoolDays = await prisma.day.count({
      where: {
        schoolYearId: existing.schoolYearId,
        isSchoolDay: true,
      },
    });

    await prisma.schoolYear.update({
      where: { id: existing.schoolYearId },
      data: { totalSchoolDays },
    });

    res.json(day);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error updating day:', error);
    res.status(500).json({ error: 'Failed to update day' });
  }
});

// POST /api/days/bulk - Bulk update days
router.post('/bulk', async (req, res) => {
  try {
    const { schoolYearId, updates } = bulkUpdateSchema.parse(req.body);

    const schoolYear = await prisma.schoolYear.findUnique({
      where: { id: schoolYearId },
    });

    if (!schoolYear) {
      return res.status(404).json({ error: 'School year not found' });
    }

    const results = [];

    for (const update of updates) {
      // Verify date is in range
      if (update.date < schoolYear.startDate || update.date > schoolYear.endDate) {
        continue; // Skip invalid dates
      }

      const day = await prisma.day.upsert({
        where: {
          schoolYearId_date: {
            schoolYearId,
            date: update.date,
          },
        },
        update: {
          ...(update.dayType !== undefined && { dayType: update.dayType }),
          ...(update.label !== undefined && { label: update.label }),
          ...(update.notes !== undefined && { notes: update.notes }),
          ...(update.isSchoolDay !== undefined && { isSchoolDay: update.isSchoolDay }),
          ...(update.scheduleId !== undefined && { scheduleId: update.scheduleId }),
        },
        create: {
          date: update.date,
          dayType: update.dayType || DayType.INSTRUCTIONAL,
          isSchoolDay: update.isSchoolDay ?? true,
          label: update.label,
          notes: update.notes,
          scheduleId: update.scheduleId,
          schoolYearId,
        },
      });

      results.push(day);
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

    res.json({ updated: results.length, days: results });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error bulk updating days:', error);
    res.status(500).json({ error: 'Failed to bulk update days' });
  }
});

// DELETE /api/days/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const day = await prisma.day.findUnique({ where: { id } });

    if (!day) {
      return res.status(404).json({ error: 'Day not found' });
    }

    await prisma.day.delete({ where: { id } });

    // Recalculate total school days
    const totalSchoolDays = await prisma.day.count({
      where: {
        schoolYearId: day.schoolYearId,
        isSchoolDay: true,
      },
    });

    await prisma.schoolYear.update({
      where: { id: day.schoolYearId },
      data: { totalSchoolDays },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting day:', error);
    res.status(500).json({ error: 'Failed to delete day' });
  }
});

export { router as dayRoutes };

