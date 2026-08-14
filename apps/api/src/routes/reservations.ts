import { Router } from 'express';
import prisma from '../prismaClient';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const { environmentId, gameId, currentOwnerId, expiresAt } = req.body;
    if (!environmentId || !gameId || !currentOwnerId || !expiresAt) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const reservation = await prisma.$transaction(async (tx) => {
      const r = await tx.reservation.create({
        data: {
          environmentId,
          gameId,
          createdById: currentOwnerId,
          currentOwnerId,
          status: 'ACTIVE',
          expiresAt: new Date(expiresAt),
        },
      });

      await tx.environment.update({
        where: { id: environmentId },
        data: { isReserved: true },
      });

      return r;
    });

    res.status(201).json(reservation);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Conflict: active reservation already exists for this environment and game' });
    }
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: req.params.id },
      include: { pocs: true, events: true },
    });
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    res.json(reservation);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/release', async (req, res, next) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.update({
        where: { id: req.params.id },
        data: {
          status: 'RELEASED',
          releasedAt: new Date(),
        },
      });

      // If there are no other active reservations for this environment, mark it unreserved
      const activeCount = await tx.reservation.count({
        where: { environmentId: reservation.environmentId, status: 'ACTIVE' },
      });

      if (activeCount === 0) {
        await tx.environment.update({
          where: { id: reservation.environmentId },
          data: { isReserved: false },
        });
      }

      return reservation;
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
