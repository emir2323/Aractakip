import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

const regionSchema = z.object({ name: z.string().min(1) });

router.get('/', async (_req, res) => {
  const regions = await prisma.region.findMany({
    orderBy: { name: 'asc' },
    include: { stations: { orderBy: { name: 'asc' } } },
  });
  res.json(regions);
});

router.post('/', async (req, res) => {
  const result = regionSchema.safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: result.error.flatten() }); return; }
  const region = await prisma.region.create({ data: result.data });
  res.status(201).json(region);
});

router.put('/:id', async (req, res) => {
  const result = regionSchema.safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: result.error.flatten() }); return; }
  try {
    const region = await prisma.region.update({ where: { id: req.params.id }, data: result.data });
    res.json(region);
  } catch { res.status(404).json({ error: 'Not found' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.region.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch { res.status(404).json({ error: 'Not found' }); }
});

router.get('/:id/stations', async (req, res) => {
  const stations = await prisma.station.findMany({
    where: { regionId: req.params.id },
    orderBy: { name: 'asc' },
  });
  res.json(stations);
});

export default router;
