import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

const personnelSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  title: z.string().min(1),
  stationId: z.string().min(1),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

function serializePersonnel(p: any) {
  return {
    ...p,
    regionId: p.station?.regionId,
  };
}

router.get('/', async (req, res) => {
  const { stationId, regionId, title } = req.query as Record<string, string>;
  const where: any = {};
  if (stationId) where.stationId = stationId;
  if (regionId) where.station = { regionId };
  if (title) where.title = title;
  const personnel = await prisma.personnel.findMany({
    where,
    include: { station: { include: { region: true } } },
    orderBy: [{ station: { name: 'asc' } }, { lastName: 'asc' }],
  });
  res.json(personnel.map(serializePersonnel));
});

router.post('/', async (req, res) => {
  const result = personnelSchema.safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: result.error.flatten() }); return; }
  const person = await prisma.personnel.create({
    data: result.data as any,
    include: { station: { include: { region: true } } },
  });
  res.status(201).json(serializePersonnel(person));
});

router.put('/:id', async (req, res) => {
  const result = personnelSchema.partial().safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: result.error.flatten() }); return; }
  try {
    const person = await prisma.personnel.update({
      where: { id: req.params.id }, data: result.data,
      include: { station: { include: { region: true } } },
    });
    res.json(serializePersonnel(person));
  } catch { res.status(404).json({ error: 'Not found' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.personnel.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch { res.status(404).json({ error: 'Not found' }); }
});

export default router;
