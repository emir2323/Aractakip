import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { requireAuth, requireAdmin, type AuthRequest } from '../middleware/auth';

const router = Router();

function getISOWeek(date: Date): { week: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { week, year: d.getUTCFullYear() };
}

const submitSchema = z.object({
  vehicleId: z.string().optional(),
  km: z.number().int().positive(),
  notes: z.string().optional(),
});

// POST /api/oil-maintenance — Driver or Admin submits KM
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  const result = submitSchema.safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: result.error.flatten() }); return; }

  const { km, notes } = result.data;
  const user = req.user!;

  // Driver must use their assigned vehicle; Admin may specify vehicleId
  const vehicleId = user.role === 'admin'
    ? (result.data.vehicleId ?? '')
    : (user.vehicleId ?? '');

  if (!vehicleId) {
    res.status(400).json({ error: 'Araç ataması bulunamadı' });
    return;
  }

  const { week, year } = getISOWeek(new Date());

  const record = await prisma.oilMaintenance.create({
    data: {
      vehicleId,
      driverId: user.id,
      km,
      weekNumber: week,
      year,
      notes,
      status: 'pending',
    },
    include: { vehicle: { select: { plate: true } }, driver: { select: { name: true, username: true } } },
  });

  res.status(201).json(record);
});

// GET /api/oil-maintenance — Admin: list all (filterable)
router.get('/', requireAdmin, async (req, res) => {
  const { week, year, vehicleId, status } = req.query as Record<string, string>;
  const { week: cw, year: cy } = getISOWeek(new Date());

  const records = await prisma.oilMaintenance.findMany({
    where: {
      ...(week ? { weekNumber: parseInt(week) } : {}),
      ...(year ? { year: parseInt(year) } : {}),
      ...(vehicleId ? { vehicleId } : {}),
      ...(status ? { status } : {}),
    },
    include: {
      vehicle: { select: { plate: true, brand: true, model: true } },
      driver: { select: { name: true, username: true } },
    },
    orderBy: { submittedAt: 'desc' },
  });

  // Also compute which vehicles haven't submitted this week
  const allVehicles = await prisma.vehicle.findMany({ select: { id: true, plate: true, brand: true, model: true } });
  const submittedVehicleIds = new Set(
    (await prisma.oilMaintenance.findMany({
      where: { weekNumber: cw, year: cy },
      select: { vehicleId: true },
    })).map(r => r.vehicleId)
  );
  const notSubmitted = allVehicles.filter(v => !submittedVehicleIds.has(v.id));

  res.json({ records, notSubmitted, currentWeek: cw, currentYear: cy });
});

// GET /api/oil-maintenance/week/:weekNumber — Get specific week
router.get('/week/:weekNumber', requireAdmin, async (req, res) => {
  const weekNumber = parseInt(req.params.weekNumber);
  const year = parseInt((req.query.year as string) ?? new Date().getFullYear().toString());

  const records = await prisma.oilMaintenance.findMany({
    where: { weekNumber, year },
    include: {
      vehicle: { select: { plate: true, brand: true, model: true } },
      driver: { select: { name: true, username: true } },
    },
    orderBy: { submittedAt: 'asc' },
  });

  res.json(records);
});

// GET /api/oil-maintenance/my — Driver: own history
router.get('/my', requireAuth, async (req: AuthRequest, res) => {
  const records = await prisma.oilMaintenance.findMany({
    where: { driverId: req.user!.id },
    include: { vehicle: { select: { plate: true } } },
    orderBy: { submittedAt: 'desc' },
    take: 20,
  });
  res.json(records);
});

// PUT /api/oil-maintenance/:id/status — Admin updates status
router.put('/:id/status', requireAdmin, async (req, res) => {
  const { status } = req.body as { status: string };
  if (!['pending', 'printed', 'done'].includes(status)) {
    res.status(400).json({ error: 'Geçersiz durum' }); return;
  }
  const record = await prisma.oilMaintenance.update({
    where: { id: req.params.id },
    data: { status },
    include: { vehicle: { select: { plate: true } }, driver: { select: { name: true, username: true } } },
  });
  res.json(record);
});

// DELETE /api/oil-maintenance/:id
router.delete('/:id', requireAdmin, async (req, res) => {
  await prisma.oilMaintenance.delete({ where: { id: req.params.id } });
  res.json({ message: 'Silindi' });
});

export default router;
