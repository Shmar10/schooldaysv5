import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const router = Router();

const periodSchema = z.object({
  name: z.string(),
  startTime: z.string(),
  endTime: z.string(),
});

const scheduleSchema = z.object({
  name: z.string().min(1),
  isDefault: z.boolean().optional().default(false),
  schoolYearId: z.string(),
  periods: z.array(periodSchema),
});

// GET /api/schedules?schoolYearId=xxx
router.get('/', async (req, res) => {
  try {
    const { schoolYearId } = req.query;

    const where: any = {};
    if (schoolYearId) {
      where.schoolYearId = schoolYearId as string;
    }

    const schedules = await prisma.schedule.findMany({
      where,
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' },
      ],
    });

    res.json(schedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
});

// GET /api/schedules/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await prisma.schedule.findUnique({
      where: { id },
      include: {
        _count: {
          select: { days: true },
        },
      },
    });

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    res.json(schedule);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
});

// POST /api/schedules
router.post('/', async (req, res) => {
  try {
    const data = scheduleSchema.parse(req.body);

    // Verify school year exists
    const schoolYear = await prisma.schoolYear.findUnique({
      where: { id: data.schoolYearId },
    });

    if (!schoolYear) {
      return res.status(404).json({ error: 'School year not found' });
    }

    // If this is set as default, unset other defaults for this school year
    if (data.isDefault) {
      await prisma.schedule.updateMany({
        where: {
          schoolYearId: data.schoolYearId,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    const schedule = await prisma.schedule.create({
      data: {
        name: data.name,
        isDefault: data.isDefault,
        schoolYearId: data.schoolYearId,
        periods: data.periods as any,
      },
    });

    res.status(201).json(schedule);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error creating schedule:', error);
    res.status(500).json({ error: 'Failed to create schedule' });
  }
});

// PUT /api/schedules/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = scheduleSchema.partial().parse(req.body);

    const existing = await prisma.schedule.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // If setting as default, unset other defaults
    if (data.isDefault === true) {
      await prisma.schedule.updateMany({
        where: {
          schoolYearId: existing.schoolYearId,
          isDefault: true,
          id: { not: id },
        },
        data: { isDefault: false },
      });
    }

    const schedule = await prisma.schedule.update({
      where: { id },
      data: {
        name: data.name,
        isDefault: data.isDefault,
        periods: data.periods as any,
      },
    });

    res.json(schedule);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error updating schedule:', error);
    res.status(500).json({ error: 'Failed to update schedule' });
  }
});

// DELETE /api/schedules/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.schedule.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ error: 'Failed to delete schedule' });
  }
});

export { router as scheduleRoutes };

