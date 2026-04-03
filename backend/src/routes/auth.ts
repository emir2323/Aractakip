import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { signToken, requireAuth, type AuthRequest } from '../middleware/auth';

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

router.post('/login', async (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Geçersiz istek' });
    return;
  }
  const { username, password } = result.data;
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401).json({ error: 'Kullanıcı adı veya şifre yanlış' });
    return;
  }
  const token = signToken({ id: user.id, username: user.username, role: user.role });
  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

router.post('/logout', (_req, res) => {
  res.json({ message: 'Logged out' });
});

router.get('/me', requireAuth, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

export default router;
