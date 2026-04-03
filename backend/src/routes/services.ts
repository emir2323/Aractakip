import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

const serviceSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

router.get('/', async (_req, res) => {
  const services = await prisma.service.findMany({ orderBy: { name: 'asc' } });
  res.json(services);
});

router.post('/', async (req, res) => {
  const result = serviceSchema.safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: result.error.flatten() }); return; }
  const service = await prisma.service.create({ data: result.data });
  res.status(201).json(service);
});

router.put('/:id', async (req, res) => {
  const result = serviceSchema.partial().safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: result.error.flatten() }); return; }
  try {
    const service = await prisma.service.update({ where: { id: req.params.id }, data: result.data });
    res.json(service);
  } catch { res.status(404).json({ error: 'Not found' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.service.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch { res.status(404).json({ error: 'Not found' }); }
});

export default router;
