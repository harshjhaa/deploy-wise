import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import prisma from '../prismaClient';
import { clearAuthCookie, requireAuth, setAuthCookie, signAuthToken } from '../auth';

const router = Router();

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body as { name?: string; email?: string; password?: string };

    if (!name?.trim() || !email?.trim() || !password || password.length < 8) {
      return res.status(400).json({ error: 'Name, email, and password (8+ chars) are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: 'USER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    const token = signAuthToken(user);
    setAuthCookie(res, token);
    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email?.trim() || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const token = signAuthToken(sessionUser);
    setAuthCookie(res, token);
    res.json({ user: sessionUser });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body as { email?: string };
    if (!email?.trim()) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return res.json({ ok: true, message: 'If an account exists, reset instructions have been created.' });
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
      prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt },
      }),
    ]);

    const response: { ok: boolean; message: string; resetToken?: string } = {
      ok: true,
      message: 'If an account exists, reset instructions have been created.',
    };
    if (process.env.NODE_ENV !== 'production') {
      response.resetToken = rawToken;
    }

    res.json(response);
  } catch (error) {
    next(error);
  }
});

router.post('/reset-password-token', async (req, res, next) => {
  try {
    const { token, newPassword, confirmPassword } = req.body as {
      token?: string;
      newPassword?: string;
      confirmPassword?: string;
    };

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'Reset token, new password, and confirmation are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Password confirmation does not match.' });
    }

    const tokenHash = createHash('sha256').update(token).digest('hex');
    const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date()) {
      return res.status(400).json({ error: 'Reset token is invalid or expired.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.$transaction([
      prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
      prisma.passwordResetToken.deleteMany({ where: { userId: resetToken.userId, id: { not: resetToken.id } } }),
    ]);

    res.json({ ok: true, message: 'Password reset successfully.' });
  } catch (error) {
    next(error);
  }
});

/*
 * Authenticated password changes remain separate from account recovery.
 */
router.post('/reset-password', requireAuth, async (req, res, next) => {
  try {
    const { newPassword, confirmPassword } = req.body as {
      newPassword?: string;
      confirmPassword?: string;
    };

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'New password and confirmation are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Password confirmation does not match.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { passwordHash },
    });

    res.json({ ok: true, message: 'Password updated successfully.' });
  } catch (error) {
    next(error);
  }
});

export default router;
