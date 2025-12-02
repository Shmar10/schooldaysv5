import { Router } from 'express';
import { DayType } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const router = Router();

const breakSchema = z.object({
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)),
  label: z.string().min(1),
  schoolYearId: z.string(),
});

// GET /api/breaks?schoolYearId=xxx
router.get('/', async (req, res) => {
  try {
    const { schoolYearId } = req.query;

    const where: any = {};
    if (schoolYearId) {
      where.schoolYearId = schoolYearId as string;
    }

    const breaks = await prisma.break.findMany({
      where,
      orderBy: { startDate: 'asc' },
    });

    res.json(breaks);
  } catch (error) {
    console.error('Error fetching breaks:', error);
    res.status(500).json({ error: 'Failed to fetch breaks' });
  }
});

// GET /api/breaks/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const breakRecord = await prisma.break.findUnique({
      where: { id },
    });

    if (!breakRecord) {
      return res.status(404).json({ error: 'Break not found' });
    }

    res.json(breakRecord);
  } catch (error) {
    console.error('Error fetching break:', error);
    res.status(500).json({ error: 'Failed to fetch break' });
  }
});

// POST /api/breaks
router.post('/', async (req, res) => {
  try {
    const data = breakSchema.parse(req.body);

    // Validate dates
    if (data.startDate >= data.endDate) {
      return res.status(400).json({ error: 'startDate must be before endDate' });
    }

    // Verify school year exists and dates are within range
    const schoolYear = await prisma.schoolYear.findUnique({
      where: { id: data.schoolYearId },
    });

    if (!schoolYear) {
      return res.status(404).json({ error: 'School year not found' });
    }

    if (data.startDate < schoolYear.startDate || data.endDate > schoolYear.endDate) {
      return res.status(400).json({ error: 'Break dates must be within school year range' });
    }

    // Check for overlapping breaks
    const overlapping = await prisma.break.findFirst({
      where: {
        schoolYearId: data.schoolYearId,
        OR: [
          {
            AND: [
              { startDate: { lte: data.endDate } },
              { endDate: { gte: data.startDate } },
            ],
          },
        ],
      },
    });

    if (overlapping) {
      return res.status(400).json({ error: 'Break overlaps with existing break' });
    }

    // Create break
    const breakRecord = await prisma.break.create({
      data: {
        startDate: data.startDate,
        endDate: data.endDate,
        label: data.label,
        schoolYearId: data.schoolYearId,
      },
    });

    // Update all days in this range to BREAK type and isSchoolDay = false
    const current = new Date(data.startDate);
    while (current <= data.endDate) {
      await prisma.day.updateMany({
        where: {
          schoolYearId: data.schoolYearId,
          date: new Date(current),
        },
        data: {
          dayType: DayType.BREAK,
          isSchoolDay: false,
          label: data.label,
        },
      });

      current.setDate(current.getDate() + 1);
    }

    // Recalculate total school days
    const totalSchoolDays = await prisma.day.count({
      where: {
        schoolYearId: data.schoolYearId,
        isSchoolDay: true,
      },
    });

    await prisma.schoolYear.update({
      where: { id: data.schoolYearId },
      data: { totalSchoolDays },
    });

    res.status(201).json(breakRecord);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error creating break:', error);
    res.status(500).json({ error: 'Failed to create break' });
  }
});

// PUT /api/breaks/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = breakSchema.partial().parse(req.body);

    const existing = await prisma.break.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Break not found' });
    }

    const startDate = data.startDate || existing.startDate;
    const endDate = data.endDate || existing.endDate;

    if (startDate >= endDate) {
      return res.status(400).json({ error: 'startDate must be before endDate' });
    }

    // Verify school year and date range
    const schoolYear = await prisma.schoolYear.findUnique({
      where: { id: existing.schoolYearId },
    });

    if (!schoolYear) {
      return res.status(404).json({ error: 'School year not found' });
    }

    if (startDate < schoolYear.startDate || endDate > schoolYear.endDate) {
      return res.status(400).json({ error: 'Break dates must be within school year range' });
    }

    // Check for overlapping breaks (excluding current)
    const overlapping = await prisma.break.findFirst({
      where: {
        schoolYearId: existing.schoolYearId,
        id: { not: id },
        OR: [
          {
            AND: [
              { startDate: { lte: endDate } },
              { endDate: { gte: startDate } },
            ],
          },
        ],
      },
    });

    if (overlapping) {
      return res.status(400).json({ error: 'Break overlaps with existing break' });
    }

    // Restore old range days to INSTRUCTIONAL (if dates changed)
    if (data.startDate || data.endDate) {
      const oldCurrent = new Date(existing.startDate);
      while (oldCurrent <= existing.endDate) {
        await prisma.day.updateMany({
          where: {
            schoolYearId: existing.schoolYearId,
            date: new Date(oldCurrent),
          },
          data: {
            dayType: DayType.INSTRUCTIONAL,
            isSchoolDay: true,
            label: null,
          },
        });
        oldCurrent.setDate(oldCurrent.getDate() + 1);
      }
    }

    // Update break
    const breakRecord = await prisma.break.update({
      where: { id },
      data: {
        startDate,
        endDate,
        label: data.label || existing.label,
      },
    });

    // Update new range days to BREAK
    const current = new Date(startDate);
    while (current <= endDate) {
      await prisma.day.updateMany({
        where: {
          schoolYearId: existing.schoolYearId,
          date: new Date(current),
        },
        data: {
          dayType: DayType.BREAK,
          isSchoolDay: false,
          label: breakRecord.label,
        },
      });
      current.setDate(current.getDate() + 1);
    }

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

    res.json(breakRecord);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error updating break:', error);
    res.status(500).json({ error: 'Failed to update break' });
  }
});

// DELETE /api/breaks/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const breakRecord = await prisma.break.findUnique({ where: { id } });

    if (!breakRecord) {
      return res.status(404).json({ error: 'Break not found' });
    }

    // Restore days in this range to INSTRUCTIONAL
    const current = new Date(breakRecord.startDate);
    while (current <= breakRecord.endDate) {
      await prisma.day.updateMany({
        where: {
          schoolYearId: breakRecord.schoolYearId,
          date: new Date(current),
        },
        data: {
          dayType: DayType.INSTRUCTIONAL,
          isSchoolDay: true,
          label: null,
        },
      });
      current.setDate(current.getDate() + 1);
    }

    await prisma.break.delete({ where: { id } });

    // Recalculate total school days
    const totalSchoolDays = await prisma.day.count({
      where: {
        schoolYearId: breakRecord.schoolYearId,
        isSchoolDay: true,
      },
    });

    await prisma.schoolYear.update({
      where: { id: breakRecord.schoolYearId },
      data: { totalSchoolDays },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting break:', error);
    res.status(500).json({ error: 'Failed to delete break' });
  }
});

export { router as breakRoutes };

