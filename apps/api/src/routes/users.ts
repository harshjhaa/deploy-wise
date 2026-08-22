import { Router } from 'express';
import prisma from '../prismaClient';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });

    res.json(users);
  } catch (error) {
    next(error);
  }
});

export default router;
