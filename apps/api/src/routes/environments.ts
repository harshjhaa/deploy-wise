import { Router } from 'express';
import prisma from '../prismaClient';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const environments = await prisma.environment.findMany({
      orderBy: { name: 'asc' },
      include: {
        reservations: {
          where: {
            status: 'ACTIVE',
          },
          include: {
            game: true,
            pocs: {
              include: {
                // assuming user relation will be added later
              },
            },
          },
        },
      },
    });

    const response = environments.map((environment) => ({
      id: environment.id,
      name: environment.name,
      description: environment.description,
      isActive: environment.isActive,
      isReserved: environment.isReserved,
      reservations: environment.reservations.map((reservation) => ({
        id: reservation.id,
        gameId: reservation.gameId,
        currentOwnerId: reservation.currentOwnerId,
        status: reservation.status,
        expiresAt: reservation.expiresAt,
      })),
    }));

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
