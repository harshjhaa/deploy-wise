import { Router } from 'express';
import prisma from '../prismaClient';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const games = await prisma.game.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(games.map((game) => ({ id: game.id, name: game.name, isActive: game.isActive })));
  } catch (error) {
    next(error);
  }
});

export default router;
