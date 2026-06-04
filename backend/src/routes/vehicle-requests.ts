import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// GET / — list requests (admin: all, onleme: own)
router.get('/', async (req: any, res) => {
  const user = req.user;
  const where: any = {};

  if (user.role === 'onleme') {
    where.requestedBy = user.id;
  }

  const requests = await prisma.vehicleRequest.findMany({
    where,
    include: {
      requester: { select: { id: true, username: true, name: true } },
      vehicle: { select: { id: true, plate: true, brand: true, model: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(requests);
});

// POST / — create request (onleme + admin)
const createSchema = z.object({
  requestDate: z.string().min(1),
  returnDate: z.string().nullable().optional(),
  purpose: z.string().min(1),
});

router.post('/', async (req: any, res) => {
  const result = createSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() });
    return;
  }
  const { requestDate, returnDate, purpose } = result.data;

  const request = await prisma.vehicleRequest.create({
    data: {
      requestedBy: req.user.id,
      requestDate: new Date(requestDate),
      returnDate: returnDate ? new Date(returnDate) : null,
      purpose,
      status: 'pending',
    },
    include: {
      requester: { select: { id: true, username: true, name: true } },
      vehicle: { select: { id: true, plate: true, brand: true, model: true } },
    },
  });

  res.status(201).json(request);
});

// PUT /:id/approve — approve + assign vehicle (admin only)
const approveSchema = z.object({
  vehicleId: z.string().min(1),
  adminNote: z.string().optional(),
});

router.put('/:id/approve', async (req: any, res) => {
  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Yetkisiz erişim' });
    return;
  }

  const result = approveSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() });
    return;
  }
  const { vehicleId, adminNote } = result.data;

  try {
    // Update vehicle status to "Görevli"
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { status: 'Görevli' },
    });

    const request = await prisma.vehicleRequest.update({
      where: { id: req.params.id },
      data: { status: 'approved', vehicleId, adminNote: adminNote ?? null },
      include: {
        requester: { select: { id: true, username: true, name: true } },
        vehicle: { select: { id: true, plate: true, brand: true, model: true } },
      },
    });

    res.json(request);
  } catch (e: any) {
    if (e.code === 'P2025') { res.status(404).json({ error: 'Kayıt bulunamadı' }); return; }
    res.status(500).json({ error: e.message });
  }
});

// PUT /:id/reject — reject (admin only)
const noteSchema = z.object({ adminNote: z.string().optional() });

router.put('/:id/reject', async (req: any, res) => {
  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Yetkisiz erişim' });
    return;
  }

  const result = noteSchema.safeParse(req.body);
  const adminNote = result.success ? result.data.adminNote : undefined;

  try {
    const request = await prisma.vehicleRequest.update({
      where: { id: req.params.id },
      data: { status: 'rejected', adminNote: adminNote ?? null },
      include: {
        requester: { select: { id: true, username: true, name: true } },
        vehicle: { select: { id: true, plate: true, brand: true, model: true } },
      },
    });
    res.json(request);
  } catch (e: any) {
    if (e.code === 'P2025') { res.status(404).json({ error: 'Kayıt bulunamadı' }); return; }
    res.status(500).json({ error: e.message });
  }
});

// PUT /:id/return — return vehicle → vehicle back to "Aktif" (admin only)
router.put('/:id/return', async (req: any, res) => {
  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Yetkisiz erişim' });
    return;
  }

  try {
    // Find the request to get vehicleId
    const existing = await prisma.vehicleRequest.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) { res.status(404).json({ error: 'Kayıt bulunamadı' }); return; }

    // Return vehicle to "Aktif"
    if (existing.vehicleId) {
      await prisma.vehicle.update({
        where: { id: existing.vehicleId },
        data: { status: 'Aktif' },
      });
    }

    const request = await prisma.vehicleRequest.update({
      where: { id: req.params.id },
      data: { status: 'returned' },
      include: {
        requester: { select: { id: true, username: true, name: true } },
        vehicle: { select: { id: true, plate: true, brand: true, model: true } },
      },
    });

    res.json(request);
  } catch (e: any) {
    if (e.code === 'P2025') { res.status(404).json({ error: 'Kayıt bulunamadı' }); return; }
    res.status(500).json({ error: e.message });
  }
});

export default router;
