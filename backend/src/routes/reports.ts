import { Router } from 'express';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/faulty-vehicles', async (req, res) => {
  const { regionId } = req.query as { regionId?: string };
  const where: any = { status: { in: ['Arızalı', 'Parça Bekliyor'] } };
  if (regionId) where.station = { regionId };
  const vehicles = await prisma.vehicle.findMany({
    where,
    include: {
      station: { include: { region: true } },
      faults: { where: { status: 'Devam Ediyor' }, include: { service: true } },
    },
  });
  res.json(vehicles.map(v => ({
    ...v,
    materials: JSON.parse(v.materials ?? '[]'),
    regionId: v.station?.regionId,
  })));
});

router.get('/document-alerts', async (_req, res) => {
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
    include: { station: { include: { region: true } } },
    orderBy: { muayeneExpiry: 'asc' },
  });
  res.json(vehicles.map(v => ({
    ...v,
    materials: JSON.parse(v.materials ?? '[]'),
    regionId: v.station?.regionId,
  })));
});

router.get('/region-summary', async (_req, res) => {
  const regions = await prisma.region.findMany({
    include: {
      stations: {
        include: {
          vehicles: true,
        },
      },
    },
  });
  const summary = regions.map(r => {
    const allVehicles = r.stations.flatMap(s => s.vehicles);
    return {
      id: r.id,
      name: r.name,
      total: allVehicles.length,
      active: allVehicles.filter(v => v.status === 'Aktif').length,
      faulty: allVehicles.filter(v => v.status === 'Arızalı').length,
      waiting: allVehicles.filter(v => v.status === 'Parça Bekliyor').length,
      onDuty: allVehicles.filter(v => v.status === 'Görevli').length,
    };
  });
  res.json(summary);
});

export default router;
