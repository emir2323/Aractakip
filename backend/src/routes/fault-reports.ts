import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { requireAuth, requireAdmin, type AuthRequest } from '../middleware/auth';

const router = Router();

const reportSchema = z.object({
  vehicleId: z.string().optional(),
  type: z.string().min(1),
  description: z.string().min(1),
  location: z.string().optional(),
  photoUrl: z.string().optional(),
});

// POST /api/fault-reports — Driver submits fault report
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  const result = reportSchema.safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: result.error.flatten() }); return; }

  const user = req.user!;
  // Driver can submit for the vehicle they selected (from body), fallback to assigned vehicle
  const vehicleId = result.data.vehicleId || (user as any).vehicleId || '';

  if (!vehicleId) { res.status(400).json({ error: 'Araç seçimi zorunludur' }); return; }

  const report = await prisma.faultReport.create({
    data: {
      driverId: user.id,
      vehicleId,
      type: result.data.type,
      description: result.data.description,
      location: result.data.location,
      photoUrl: result.data.photoUrl,
      status: 'pending',
    },
    include: {
      vehicle: { select: { plate: true } },
      driver: { select: { name: true, username: true } },
    },
  });

  res.status(201).json(report);
});

// GET /api/fault-reports — Admin: list all
router.get('/', requireAdmin, async (req, res) => {
  const { status } = req.query as { status?: string };
  const reports = await prisma.faultReport.findMany({
    where: status ? { status } : {},
    include: {
      vehicle: { select: { plate: true, brand: true, model: true } },
      driver: { select: { name: true, username: true } },
    },
    orderBy: { reportedAt: 'desc' },
  });
  res.json(reports);
});

// GET /api/fault-reports/my — Driver: own reports
router.get('/my', requireAuth, async (req: AuthRequest, res) => {
  const reports = await prisma.faultReport.findMany({
    where: { driverId: req.user!.id },
    include: { vehicle: { select: { plate: true } } },
    orderBy: { reportedAt: 'desc' },
    take: 20,
  });
  res.json(reports);
});

// GET /api/fault-reports/pending-count — Admin: count pending
router.get('/pending-count', requireAdmin, async (_req, res) => {
  const count = await prisma.faultReport.count({ where: { status: 'pending' } });
  res.json({ count });
});

// GET /api/fault-reports/:id
router.get('/:id', requireAdmin, async (req, res) => {
  const report = await prisma.faultReport.findUnique({
    where: { id: req.params.id },
    include: {
      vehicle: { select: { plate: true, brand: true, model: true } },
      driver: { select: { name: true, username: true } },
    },
  });
  if (!report) { res.status(404).json({ error: 'Bulunamadı' }); return; }
  res.json(report);
});

// PUT /api/fault-reports/:id/review — Admin reviews with note
router.put('/:id/review', requireAdmin, async (req: AuthRequest, res) => {
  const { adminNote } = req.body as { adminNote?: string };
  const report = await prisma.faultReport.update({
    where: { id: req.params.id },
    data: {
      status: 'reviewed',
      adminNote,
      reviewedAt: new Date(),
      reviewedBy: req.user!.username,
    },
    include: {
      vehicle: { select: { plate: true } },
      driver: { select: { name: true, username: true } },
    },
  });
  res.json(report);
});

// PUT /api/fault-reports/:id/reject — Admin rejects
router.put('/:id/reject', requireAdmin, async (req: AuthRequest, res) => {
  const { adminNote } = req.body as { adminNote?: string };
  const report = await prisma.faultReport.update({
    where: { id: req.params.id },
    data: {
      status: 'rejected',
      adminNote,
      reviewedAt: new Date(),
      reviewedBy: req.user!.username,
    },
    include: {
      vehicle: { select: { plate: true } },
      driver: { select: { name: true, username: true } },
    },
  });
  res.json(report);
});

// PUT /api/fault-reports/:id/convert — Admin converts to official Fault
router.put('/:id/convert', requireAdmin, async (req: AuthRequest, res) => {
  const report = await prisma.faultReport.findUnique({ where: { id: req.params.id } });
  if (!report) { res.status(404).json({ error: 'Bulunamadı' }); return; }

  const { fault, updated } = await prisma.$transaction(async (tx) => {
    const fault = await tx.fault.create({
      data: {
        vehicleId: report.vehicleId,
        type: report.type,
        description: report.description,
        location: report.location,
        startDate: report.reportedAt,
        status: 'Devam Ediyor',
      },
    });
    await tx.vehicle.update({ where: { id: report.vehicleId }, data: { status: 'Arızalı' } });
    const updated = await tx.faultReport.update({
      where: { id: req.params.id },
      data: {
        status: 'converted',
        convertedToFaultId: fault.id,
        reviewedAt: new Date(),
        reviewedBy: req.user!.username,
      },
      include: {
        vehicle: { select: { plate: true } },
        driver: { select: { name: true, username: true } },
      },
    });
    return { fault, updated };
  });

  res.json({ report: updated, faultId: fault.id });
});

// DELETE /api/fault-reports/:id
router.delete('/:id', requireAdmin, async (req, res) => {
  await prisma.faultReport.delete({ where: { id: req.params.id } });
  res.json({ message: 'Silindi' });
});

export default router;
