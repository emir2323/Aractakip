import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

const vehicleSchema = z.object({
  plate: z.string().min(1),
  brand: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1900).max(2100),
  stationId: z.string().min(1),
  status: z.enum(['Aktif', 'Arızalı', 'Parça Bekliyor', 'Görevli']),
  dutyStationId: z.string().nullable().optional(),
  materials: z.array(z.string()).optional().default([]),
  insuranceExpiry: z.string().nullable().optional(),
  kaskoExpiry: z.string().nullable().optional(),
  muayeneExpiry: z.string().nullable().optional(),
  notes: z.string().optional(),
});

function toDateOrNull(s?: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function serializeVehicle(v: any) {
  return {
    ...v,
    materials: JSON.parse(v.materials ?? '[]'),
    regionId: v.station?.regionId,
    dutyRegionId: v.dutyStation?.regionId ?? null,
  };
}

router.get('/', async (req, res) => {
  const { regionId, stationId, status, search } = req.query as Record<string, string>;
  const where: any = {};
  if (stationId) where.stationId = stationId;
  if (status) where.status = status;
  if (regionId) where.station = { regionId };
  if (search) {
    where.OR = [
      { plate: { contains: search } },
      { brand: { contains: search } },
      { model: { contains: search } },
    ];
  }
  const vehicles = await prisma.vehicle.findMany({
    where,
    include: { station: { include: { region: true } }, dutyStation: { include: { region: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(vehicles.map(serializeVehicle));
});

router.get('/alerts', async (_req, res) => {
  const now = new Date();
  const in60 = new Date(now.getTime() + 60 * 86400000);
  const vehicles = await prisma.vehicle.findMany({
    where: {
      OR: [
        { muayeneExpiry: { lte: in60 } },
        { insuranceExpiry: { lte: in60 } },
        { kaskoExpiry: { lte: in60 } },
      ],
    },
    include: { station: { include: { region: true } }, dutyStation: { include: { region: true } } },
  });
  res.json(vehicles.map(serializeVehicle));
});

router.get('/:id', async (req, res) => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: req.params.id },
    include: {
      station: { include: { region: true } },
      dutyStation: { include: { region: true } },
      faults: { include: { service: true }, orderBy: { startDate: 'desc' } },
      photos: { orderBy: { createdAt: 'asc' }, select: { id: true, mimeType: true, fileName: true, createdAt: true, data: true } },
    },
  });
  if (!vehicle) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(serializeVehicle(vehicle));
});

router.post('/', async (req, res) => {
  const result = vehicleSchema.safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: result.error.flatten() }); return; }
  const { materials, insuranceExpiry, kaskoExpiry, muayeneExpiry, ...rest } = result.data;
  try {
    const vehicle = await prisma.vehicle.create({
      data: {
        ...rest,
        materials: JSON.stringify(materials),
        insuranceExpiry: toDateOrNull(insuranceExpiry),
        kaskoExpiry: toDateOrNull(kaskoExpiry),
        muayeneExpiry: toDateOrNull(muayeneExpiry),
        dutyStationId: rest.dutyStationId ?? null,
      },
      include: { station: { include: { region: true } }, dutyStation: { include: { region: true } } },
    });
    res.status(201).json(serializeVehicle(vehicle));
  } catch (e: any) {
    if (e.code === 'P2002') { res.status(409).json({ error: 'Plaka zaten kayıtlı' }); return; }
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', async (req, res) => {
  const result = vehicleSchema.partial().safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: result.error.flatten() }); return; }
  const { materials, insuranceExpiry, kaskoExpiry, muayeneExpiry, ...rest } = result.data;
  try {
    const data: any = { ...rest };
    if (materials !== undefined) data.materials = JSON.stringify(materials);
    if (insuranceExpiry !== undefined) data.insuranceExpiry = toDateOrNull(insuranceExpiry);
    if (kaskoExpiry !== undefined) data.kaskoExpiry = toDateOrNull(kaskoExpiry);
    if (muayeneExpiry !== undefined) data.muayeneExpiry = toDateOrNull(muayeneExpiry);
    if ('dutyStationId' in rest) data.dutyStationId = rest.dutyStationId ?? null;
    const vehicle = await prisma.vehicle.update({
      where: { id: req.params.id }, data,
      include: { station: { include: { region: true } }, dutyStation: { include: { region: true } } },
    });
    res.json(serializeVehicle(vehicle));
  } catch (e: any) {
    if (e.code === 'P2025') { res.status(404).json({ error: 'Not found' }); return; }
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.vehicle.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch { res.status(404).json({ error: 'Not found' }); }
});

const renewSchema = z.object({ date: z.string().min(1) });

function makeRenewHandler(field: 'muayeneExpiry' | 'insuranceExpiry' | 'kaskoExpiry') {
  return async (req: any, res: any) => {
    const result = renewSchema.safeParse(req.body);
    if (!result.success) { res.status(400).json({ error: 'Date required' }); return; }
    try {
      const vehicle = await prisma.vehicle.update({
        where: { id: req.params.id },
        data: { [field]: new Date(result.data.date) },
        include: { station: { include: { region: true } }, dutyStation: { include: { region: true } } },
      });
      res.json(serializeVehicle(vehicle));
    } catch { res.status(404).json({ error: 'Not found' }); }
  };
}

router.put('/:id/renew-muayene', makeRenewHandler('muayeneExpiry'));
router.put('/:id/renew-sigorta', makeRenewHandler('insuranceExpiry'));
router.put('/:id/renew-kasko', makeRenewHandler('kaskoExpiry'));

// POST /api/vehicles/:id/photos — upload a photo (base64)
router.post('/:id/photos', async (req, res) => {
  const { data, mimeType, fileName } = req.body as {
    data: string; mimeType?: string; fileName?: string;
  };
  if (!data) { res.status(400).json({ error: 'Photo data required' }); return; }

  // Limit: max 10 photos per vehicle
  const count = await (prisma as any).vehiclePhoto.count({ where: { vehicleId: req.params.id } });
  if (count >= 10) { res.status(400).json({ error: 'Maksimum 10 fotoğraf yüklenebilir' }); return; }

  const photo = await (prisma as any).vehiclePhoto.create({
    data: {
      vehicleId: req.params.id,
      data,
      mimeType: mimeType ?? 'image/jpeg',
      fileName: fileName ?? null,
    },
    select: { id: true, mimeType: true, fileName: true, createdAt: true, data: true },
  });
  res.status(201).json(photo);
});

// DELETE /api/vehicles/:id/photos/:photoId — delete a photo
router.delete('/:id/photos/:photoId', async (req, res) => {
  try {
    await (prisma as any).vehiclePhoto.delete({
      where: { id: req.params.photoId, vehicleId: req.params.id },
    });
    res.status(204).end();
  } catch {
    res.status(404).json({ error: 'Photo not found' });
  }
});

export default router;
