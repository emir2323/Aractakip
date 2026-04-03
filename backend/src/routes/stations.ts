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
    await prisma.station.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch { res.status(404).json({ error: 'Not found' }); }
});

export default router;
