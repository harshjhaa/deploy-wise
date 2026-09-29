import { Router } from 'express';
import { requireAuth } from '../auth';
import prisma from '../prismaClient';

const router = Router();

router.use(requireAuth);

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
            currentOwner: {
              select: {
                name: true,
                email: true,
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
      reservations: environment.reservations.map((reservation) => ({
        id: reservation.id,
        gameId: reservation.gameId,
        currentOwnerId: reservation.currentOwnerId,
        currentOwnerName: reservation.currentOwner.name ?? reservation.currentOwner.email,
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
