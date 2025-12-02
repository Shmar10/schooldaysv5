import { Router } from 'express';
import { UploadType } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';

const router = Router();

// Configure multer for file uploads
const uploadDir = env.UPLOAD_DIR;
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and PDF files are allowed'));
    }
  },
});

// GET /api/uploads?schoolYearId=xxx
router.get('/', async (req, res) => {
  try {
    const { schoolYearId } = req.query;

    const where: any = {};
    if (schoolYearId) {
      where.schoolYearId = schoolYearId as string;
    }

    const uploads = await prisma.upload.findMany({
      where,
      orderBy: { uploadedAt: 'desc' },
    });

    res.json(uploads);
  } catch (error) {
    console.error('Error fetching uploads:', error);
    res.status(500).json({ error: 'Failed to fetch uploads' });
  }
});

// GET /api/uploads/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const upload = await prisma.upload.findUnique({
      where: { id },
    });

    if (!upload) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    res.json(upload);
  } catch (error) {
    console.error('Error fetching upload:', error);
    res.status(500).json({ error: 'Failed to fetch upload' });
  }
});

// POST /api/uploads
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { type, schoolYearId } = req.body;

    if (!type || !Object.values(UploadType).includes(type as UploadType)) {
      return res.status(400).json({ error: 'Invalid upload type' });
    }

    // If schoolYearId provided, verify it exists
    if (schoolYearId) {
      const schoolYear = await prisma.schoolYear.findUnique({
        where: { id: schoolYearId },
      });

      if (!schoolYear) {
        return res.status(404).json({ error: 'School year not found' });
      }
    }

    const uploadRecord = await prisma.upload.create({
      data: {
        type: type as UploadType,
        originalFilename: req.file.originalname,
        filePath: req.file.path,
        schoolYearId: schoolYearId || null,
        parsed: false,
      },
    });

    res.status(201).json(uploadRecord);
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// PUT /api/uploads/:id - Update upload metadata (e.g., mark as parsed)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateSchema = z.object({
      parsed: z.boolean().optional(),
      parsedSummary: z.any().optional(),
      schoolYearId: z.string().optional().nullable(),
    });

    const data = updateSchema.parse(req.body);

    const upload = await prisma.upload.update({
      where: { id },
      data: {
        parsed: data.parsed,
        parsedSummary: data.parsedSummary as any,
        schoolYearId: data.schoolYearId,
      },
    });

    res.json(upload);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error updating upload:', error);
    res.status(500).json({ error: 'Failed to update upload' });
  }
});

// GET /api/uploads/:id/file - Serve the uploaded file
router.get('/:id/file', async (req, res) => {
  try {
    const { id } = req.params;
    const upload = await prisma.upload.findUnique({
      where: { id },
    });

    if (!upload) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    if (!fs.existsSync(upload.filePath)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    res.sendFile(path.resolve(upload.filePath));
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({ error: 'Failed to serve file' });
  }
});

// DELETE /api/uploads/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const upload = await prisma.upload.findUnique({ where: { id } });

    if (!upload) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    // Delete file from disk
    if (fs.existsSync(upload.filePath)) {
      fs.unlinkSync(upload.filePath);
    }

    await prisma.upload.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting upload:', error);
    res.status(500).json({ error: 'Failed to delete upload' });
  }
});

export { router as uploadRoutes };

