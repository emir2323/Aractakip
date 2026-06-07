import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

const stationSchema = z.object({
  name: z.string().min(1),
  regionId: z.string().min(1),
});

router.get('/', async (_req, res) => {
  const stations = await prisma.station.findMany({
    include: { region: true },
    orderBy: { name: 'asc' },
  });
  res.json(stations);
});

router.post('/', async (req, res) => {
  const result = stationSchema.safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: result.error.flatten() }); return; }
  const station = await prisma.station.create({ data: result.data, include: { region: true } });
  res.status(201).json(station);
});

router.put('/:id', async (req, res) => {
  const result = stationSchema.partial().safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: result.error.flatten() }); return; }
  try {
    const station = await prisma.station.update({ where: { id: req.params.id }, data: result.data });
    res.json(station);
  } catch { res.status(404).json({ error: 'Not found' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    // İlişkili araç ve personeli paralel kontrol et
    const [vehicleCount, personnelCount] = await Promise.all([
      prisma.vehicle.count({ where: { stationId: req.params.id } }),
      prisma.personnel.count({ where: { stationId: req.params.id } }),
    ]);

    if (vehicleCount > 0) {
      res.status(409).json({
        error: `Bu istasyona bağlı ${vehicleCount} araç var. Önce araçları başka bir istasyona taşıyın veya silin.`,
      });
      return;
    }

    if (personnelCount > 0) {
      res.status(409).json({
        error: `Bu istasyona bağlı ${personnelCount} personel var. Önce personeli silin veya başka istasyona taşıyın.`,
      });
      return;
    }

    await prisma.station.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (e: any) {
    if (e.code === 'P2025') { res.status(404).json({ error: 'İstasyon bulunamadı' }); return; }
    res.status(500).json({ error: e.message });
  }
});

export default router;
