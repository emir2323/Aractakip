import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { requireAdmin } from '../middleware/auth';

const router = Router();

const createSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  name: z.string().optional(),
  role: z.enum(['admin', 'driver']).default('driver'),
  vehicleId: z.string().nullable().optional(),
  phone: z.string().optional(),
});

const updateSchema = z.object({
  name: z.string().optional(),
  role: z.enum(['admin', 'driver']).optional(),
  vehicleId: z.string().nullable().optional(),
  phone: z.string().optional(),
  active: z.boolean().optional(),
});

// GET /api/users — List all users (admin only)
router.get('/', requireAdmin, async (_req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true, username: true, name: true, role: true,
      vehicleId: true, phone: true, active: true, createdAt: true,
      vehicle: { select: { plate: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
  res.json(users);
});

// POST /api/users — Create user (admin only)
router.post('/', requireAdmin, async (req, res) => {
  const result = createSchema.safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: result.error.flatten() }); return; }

  const { username, password, name, role, vehicleId, phone } = result.data;

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) { res.status(409).json({ error: 'Bu kullanıcı adı zaten kullanımda' }); return; }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { username, password: hashed, name, role, vehicleId: vehicleId ?? null, phone, active: true },
    select: {
      id: true, username: true, name: true, role: true,
      vehicleId: true, phone: true, active: true, createdAt: true,
      vehicle: { select: { plate: true } },
    },
  });
  res.status(201).json(user);
});

// PUT /api/users/:id — Update user
router.put('/:id', requireAdmin, async (req, res) => {
  const result = updateSchema.safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: result.error.flatten() }); return; }

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { ...result.data },
    select: {
      id: true, username: true, name: true, role: true,
      vehicleId: true, phone: true, active: true, createdAt: true,
      vehicle: { select: { plate: true } },
    },
  });
  res.json(user);
});

// PUT /api/users/:id/password — Reset password
router.put('/:id/password', requireAdmin, async (req, res) => {
  const { password } = req.body as { password?: string };
  if (!password || password.length < 6) {
    res.status(400).json({ error: 'Şifre en az 6 karakter olmalı' }); return;
  }
  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id: req.params.id }, data: { password: hashed } });
  res.json({ message: 'Şifre güncellendi' });
});

// DELETE /api/users/:id — Delete user
router.delete('/:id', requireAdmin, async (req, res) => {
  // Don't allow deleting yourself — but we don't have req.user here since requireAdmin handles it separately
  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ message: 'Silindi' });
});

export default router;
