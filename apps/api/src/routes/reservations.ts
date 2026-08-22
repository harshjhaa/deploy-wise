import { Router } from 'express';
import prisma from '../prismaClient';
import {
  createReservationEvent,
  findReservationById,
  findActiveReservationForPoc,
  httpError,
  missingBodyFields,
  updateReservationWithEvent,
} from './reservations.utils';

const router = Router();


// Create a new reservation
router.post('/', async (req, res, next) => {
  try {
    const { environmentId, gameId, currentOwnerId, expiresAt, createdById, pocs } = req.body as any;
    if (missingBodyFields(req.body, ['environmentId', 'gameId', 'currentOwnerId', 'expiresAt']).length > 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // If createdById is not provided, default to currentOwnerId
    const creatorId = createdById || currentOwnerId;
    if (!Array.isArray(pocs) || pocs.length < 2 || pocs.length > 3) {
      return res.status(400).json({ error: 'Reservation requires 1 primary and 1-2 secondary POCs' });
    }

    // Validate POCs
    const pocsInput: Array<{ userId: string; isPrimary: boolean }> = pocs;
    if (pocsInput.some((p) => !p || typeof p.userId !== 'string' || typeof p.isPrimary !== 'boolean')) {
      return res.status(400).json({ error: 'Each POC must include userId and isPrimary' });
    }

    // Ensure exactly one primary POC
    const userIds = pocsInput.map((p) => p.userId);
    if (new Set(userIds).size !== userIds.length) {
      return res.status(400).json({ error: 'A user cannot be selected more than once for the same reservation' });
    }

    // Validate that there is exactly 1 primary and 1-2 secondary POCs
    const primaryCount = pocsInput.filter((p) => p.isPrimary).length;
    const secondaryCount = pocsInput.length - primaryCount;
    if (primaryCount !== 1 || secondaryCount < 1 || secondaryCount > 2) {
      return res.status(400).json({ error: 'Reservation requires exactly 1 primary and 1-2 secondary POCs' });
    }

    // Check for existing active reservation for the same environment and game
    const activeReservation = await prisma.reservation.findFirst({
      where: { environmentId, gameId, status: 'ACTIVE' },
      select: { id: true },
    });
    if (activeReservation) {
      return res.status(409).json({ error: 'An active reservation already exists for this environment and game' });
    }

    // Validate that all user IDs exist in the database
    const users = await prisma.user.findMany({ where: { id: { in: [...new Set([...userIds, creatorId, currentOwnerId])] } }, select: { id: true } });
    if (users.length !== new Set([...userIds, creatorId, currentOwnerId]).size) {
      return res.status(400).json({ error: 'One or more selected users do not exist' });
    }

    const reservation = await prisma.$transaction(async (tx) => {
      const r = await tx.reservation.create({
        data: {
          environmentId,
          gameId,
          createdById: creatorId,
          currentOwnerId,
          status: 'ACTIVE',
          expiresAt: new Date(expiresAt),
        },
      });

      // create POCs
      await tx.reservationPOC.createMany({
        data: pocsInput.map((p) => ({ reservationId: r.id, userId: p.userId, isPrimary: p.isPrimary })),
      });

      // record event for creation
      await createReservationEvent(tx, {
        reservationId: r.id,
        eventType: 'CREATED',
        performedBy: creatorId,
      });

      // return the reservation with POCs and events included
      return findReservationById(tx, r.id, { pocs: true, events: true });
    });

    res.status(201).json(reservation);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Conflict: active reservation already exists for this environment and game' });
    }
    next(error);
  }
});

// Get reservation by ID
router.get('/:id', async (req, res, next) => {
  try {
    const reservation = await findReservationById(prisma, req.params.id, { pocs: true, events: true });
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    res.json(reservation);
  } catch (error) {
    next(error);
  }
});

// List reservations with optional filters
router.get('/', async (req, res, next) => {
  try {
    const { environmentId, gameId, status, limit, offset } = req.query as any;

    const where: any = {};
    if (environmentId) where.environmentId = environmentId;
    if (gameId) where.gameId = gameId;
    if (status) where.status = status;

    const take = limit ? parseInt(limit, 10) : 100;
    const skip = offset ? parseInt(offset, 10) : 0;

    const reservations = await prisma.reservation.findMany({
      where,
      include: { pocs: true, events: true },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });

    res.json(reservations);
  } catch (error) {
    next(error);
  }
});

// Release a reservation
router.post('/:id/release', async (req, res, next) => {
  try {
    const { performedById } = req.body as any;
    if (missingBodyFields(req.body, ['performedById']).length > 0) {
      return res.status(400).json({ error: 'performedById is required to release a reservation' });
    }

    const result = await prisma.$transaction(async (tx) => {
      await findActiveReservationForPoc(tx, req.params.id, performedById, 'released');

      // Update reservation status to RELEASED
      const reservation = await updateReservationWithEvent(
        tx,
        req.params.id,
        { status: 'RELEASED', releasedAt: new Date() },
        { eventType: 'RELEASED', performedBy: performedById },
      );

      return reservation;
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Extend reservation expiry
router.post('/:id/extend', async (req, res, next) => {
  try {
    const { newExpiresAt, performedById } = req.body as any;
    if (missingBodyFields(req.body, ['newExpiresAt', 'performedById']).length > 0) {
      return res.status(400).json({ error: 'newExpiresAt and performedById are required to extend a reservation' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const reservation = await findActiveReservationForPoc(tx, req.params.id, performedById, 'extended');

      const oldExpiresAt = reservation.expiresAt;

      return updateReservationWithEvent(
        tx,
        req.params.id,
        { expiresAt: new Date(newExpiresAt) },
        {
          eventType: 'EXTENDED',
          performedBy: performedById,
          oldExpiresAt,
          newExpiresAt: new Date(newExpiresAt),
        },
      );
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Handover ownership
router.post('/:id/handover', async (req, res, next) => {
  try {
    const { toUserId, performedById } = req.body as any;
    if (missingBodyFields(req.body, ['toUserId', 'performedById']).length > 0) {
      return res.status(400).json({ error: 'toUserId and performedById are required to hand over a reservation' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const reservation = await findActiveReservationForPoc(tx, req.params.id, performedById, 'handed over');

      const targetUser = await tx.user.findUnique({ where: { id: toUserId }, select: { id: true } });
      if (!targetUser) throw httpError('Target user not found', 400);

      const fromUserId = reservation.currentOwnerId;

      return updateReservationWithEvent(
        tx,
        req.params.id,
        { currentOwnerId: toUserId },
        { eventType: 'HANDOVER', performedBy: performedById, fromUserId, toUserId },
      );
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
