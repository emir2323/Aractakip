import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

const faultSchema = z.object({
  vehicleId: z.string().min(1),
  type: z.string().min(1),
  description: z.string().min(1),
  location: z.string().optional(),
  serviceId: z.string().nullable().optional(),
  serviceName: z.string().nullable().optional(),
  startDate: z.string().min(1),
  endDate: z.string().nullable().optional(),
  status: z.enum(['Devam Ediyor', 'Çözüldü']),
});

function serializeFault(f: any) {
  return {
    ...f,
    vehicleRegionId: f.vehicle?.station?.regionId,
  };
}

router.get('/', async (req, res) => {
  const { vehicleId, type, status, regionId } = req.query as Record<string, string>;
  const where: any = {};
  if (vehicleId) where.vehicleId = vehicleId;
  if (type) where.type = type;
  if (status) where.status = status;
  if (regionId) where.vehicle = { station: { regionId } };
  const faults = await prisma.fault.findMany({
    where,
    include: {
      vehicle: { include: { station: { include: { region: true } } } },
      service: true,
    },
    orderBy: { startDate: 'desc' },
  });
  res.json(faults.map(serializeFault));
});

router.post('/', async (req, res) => {
  const result = faultSchema.safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: result.error.flatten() }); return; }
  const { startDate, endDate, serviceId, ...rest } = result.data;
  const fault = await prisma.fault.create({
    data: {
      ...rest,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      serviceId: serviceId ?? null,
    } as any,
    include: {
      vehicle: { include: { station: { include: { region: true } } } },
      service: true,
    },
  });
  res.status(201).json(serializeFault(fault));
});

router.put('/:id', async (req, res) => {
  const result = faultSchema.partial().safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: result.error.flatten() }); return; }
  const { startDate, endDate, serviceId, ...rest } = result.data;
  const data: any = { ...rest };
  if (startDate) data.startDate = new Date(startDate);
  if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;
  if (serviceId !== undefined) data.serviceId = serviceId ?? null;
  try {
    const fault = await prisma.fault.update({
      where: { id: req.params.id }, data,
      include: {
        vehicle: { include: { station: { include: { region: true } } } },
        service: true,
      },
    });
    res.json(serializeFault(fault));
  } catch { res.status(404).json({ error: 'Not found' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.fault.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch { res.status(404).json({ error: 'Not found' }); }
});

// Vehicle-specific faults
router.get('/vehicle/:vehicleId', async (req, res) => {
  const faults = await prisma.fault.findMany({
    where: { vehicleId: req.params.vehicleId },
    include: { service: true },
    orderBy: { startDate: 'desc' },
  });
  res.json(faults);
});

export default router;
