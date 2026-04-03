import { Router } from 'express';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/', async (_req, res) => {
  const settings = await prisma.setting.findMany();
  const result: Record<string, any> = {};
  for (const s of settings) {
    try { result[s.key] = JSON.parse(s.value); } catch { result[s.key] = s.value; }
  }
  res.json(result);
});

router.put('/:key', async (req, res) => {
  const { key } = req.params;
  const value = typeof req.body.value === 'string' ? req.body.value : JSON.stringify(req.body.value);
  const setting = await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
  try { res.json({ key: setting.key, value: JSON.parse(setting.value) }); }
  catch { res.json(setting); }
});

export default router;
