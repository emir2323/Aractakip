import { Router } from 'express';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/export', async (_req, res) => {
  const [regions, stations, vehicles, faults, personnel, services, settings] = await Promise.all([
    prisma.region.findMany(),
    prisma.station.findMany(),
    prisma.vehicle.findMany(),
    prisma.fault.findMany(),
    prisma.personnel.findMany(),
    prisma.service.findMany(),
    prisma.setting.findMany(),
  ]);
  res.json({
    exportDate: new Date().toISOString(),
    regions, stations,
    vehicles: vehicles.map(v => ({ ...v, materials: JSON.parse(v.materials ?? '[]') })),
    faults, personnel, services, settings,
  });
});

export default router;
