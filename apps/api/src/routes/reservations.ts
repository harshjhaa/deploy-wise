import { Router } from 'express';
import { createHash, randomBytes } from 'crypto';
import prisma from '../prismaClient';
import { requireAuth } from '../auth';
import {
  createReservationEvent,
  findReservationById,
  findActiveReservationForPoc,
  httpError,
  missingBodyFields,
  updateReservationWithEvent,
} from './reservations.utils';

const router = Router();

router.use(requireAuth);

// Create a new reservation
router.post('/', async (req, res, next) => {
  try {
    const { environmentId, gameId, currentOwnerId, expiresAt, pocs } = req.body as any;
    if (missingBodyFields(req.body, ['environmentId', 'gameId', 'currentOwnerId', 'expiresAt']).length > 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const creatorId = req.user!.id;
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

    const take = limit ? Number.parseInt(limit, 10) : 100;
    const skip = offset ? Number.parseInt(offset, 10) : 0;

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
    const { reason } = req.body as { reason?: string };
    const performedById = req.user!.id;
    const isAdminOverride = req.user!.role === 'ADMIN';
    if (isAdminOverride && !reason?.trim()) {
      return res.status(400).json({ error: 'A reason is required for an admin override.' });
    }

    const result = await prisma.$transaction(async (tx) => {
      if (!isAdminOverride) {
        const reservation = await findReservationById(tx, req.params.id, { pocs: true });
        if (!reservation) throw httpError('Reservation not found', 404);
        if (reservation.status !== 'ACTIVE') {
          throw httpError('Only an active reservation can be released', 409);
        }

        const isCurrentOwner = reservation.currentOwnerId === performedById;
        const isCurrentPoc = reservation.pocs.some((poc) => poc.userId === performedById);
        if (!isCurrentOwner && !isCurrentPoc) {
          throw httpError('Only the current owner, a POC, or an admin can release this reservation', 403);
        }
      }

      // Update reservation status to RELEASED
      const reservation = await updateReservationWithEvent(
        tx,
        req.params.id,
        { status: 'RELEASED', releasedAt: new Date() },
        {
          eventType: isAdminOverride ? 'ADMIN_OVERRIDE_RELEASED' : 'RELEASED',
          performedBy: performedById,
          metadata: isAdminOverride ? { reason: reason!.trim() } : undefined,
        },
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
    const { newExpiresAt, reason } = req.body as any;
    if (missingBodyFields(req.body, ['newExpiresAt']).length > 0) {
      return res.status(400).json({ error: 'newExpiresAt is required to extend a reservation' });
    }

    const performedById = req.user!.id;
    const isAdminOverride = req.user!.role === 'ADMIN';
    if (isAdminOverride && !reason?.trim()) {
      return res.status(400).json({ error: 'A reason is required for an admin override.' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const reservation = await findReservationById(tx, req.params.id, { pocs: true });
      if (!reservation) throw httpError('Reservation not found', 404);
      if (reservation.status !== 'ACTIVE') {
        throw httpError('Only an active reservation can be extended', 409);
      }

      if (!isAdminOverride) {
        const isCurrentOwner = reservation.currentOwnerId === performedById;
        const isCurrentPoc = reservation.pocs.some((poc) => poc.userId === performedById);
        if (!isCurrentOwner && !isCurrentPoc) {
          throw httpError('Only the current owner, a POC, or an admin can extend this reservation', 403);
        }
      }

      const oldExpiresAt = reservation.expiresAt;

      return updateReservationWithEvent(
        tx,
        req.params.id,
        { expiresAt: new Date(newExpiresAt) },
        {
          eventType: isAdminOverride ? 'ADMIN_OVERRIDE_EXTENDED' : 'EXTENDED',
          performedBy: performedById,
          oldExpiresAt,
          newExpiresAt: new Date(newExpiresAt),
          metadata: isAdminOverride ? { reason: reason!.trim() } : undefined,
        },
      );
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Generate a shareable takeover token for a reservation
router.post('/:id/takeover-token', async (req, res, next) => {
  try {
    const { reason } = req.body as { reason?: string };
    const performedById = req.user!.id;
    const reservation = await findReservationById(prisma, req.params.id, { pocs: true });
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const isAdminOverride = req.user!.role === 'ADMIN';
    const isCurrentOwner = reservation.currentOwnerId === performedById;
    const isCurrentPoc = reservation.pocs.some((poc) => poc.userId === performedById);
    if (!isAdminOverride && !isCurrentOwner && !isCurrentPoc) {
      return res.status(403).json({ error: 'Only the current owner, a POC, or an admin can generate a takeover token.' });
    }

    if (isAdminOverride && !reason?.trim()) {
      return res.status(400).json({ error: 'A reason is required for an admin takeover token.' });
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const result = await prisma.$transaction(async (tx) => {
      await tx.handoverToken.deleteMany({ where: { reservationId: reservation.id, usedAt: null } });
      const createdToken = await tx.handoverToken.create({
        data: {
          reservationId: reservation.id,
          tokenHash,
          createdBy: performedById,
          expiresAt,
        },
      });

      await createReservationEvent(tx, {
        reservationId: reservation.id,
        eventType: isAdminOverride ? 'ADMIN_OVERRIDE_TAKEOVER_TOKEN_CREATED' : 'TAKEOVER_TOKEN_CREATED',
        performedBy: performedById,
        metadata: {
          tokenId: createdToken.id,
          expiresAt: expiresAt.toISOString(),
          ...(reason?.trim() ? { reason: reason.trim() } : {}),
        },
      });

      return createdToken;
    });

    res.json({
      ok: true,
      message: 'Takeover token created successfully.',
      token: process.env.NODE_ENV !== 'production' ? rawToken : undefined,
      tokenId: result.id,
      expiresAt,
    });
  } catch (error) {
    next(error);
  }
});

// Redeem a shareable takeover token to transfer ownership
router.post('/:id/redeem-takeover', async (req, res, next) => {
  try {
    const { token, toUserId, pocs, reason } = req.body as any;
    if (!token || !toUserId || !Array.isArray(pocs)) {
      return res.status(400).json({ error: 'Token, toUserId, and POCs are required.' });
    }

    const performedById = req.user!.id;
    const isAdminOverride = req.user!.role === 'ADMIN';
    if (isAdminOverride && !reason?.trim()) {
      return res.status(400).json({ error: 'A reason is required for an admin takeover.' });
    }

    const newPocs: Array<{ userId: string; isPrimary: boolean }> = pocs;
    if (newPocs.some((p) => !p || typeof p.userId !== 'string' || typeof p.isPrimary !== 'boolean')) {
      return res.status(400).json({ error: 'Each POC must include userId and isPrimary' });
    }

    const newPocUserIds = newPocs.map((p) => p.userId);
    if (new Set(newPocUserIds).size !== newPocUserIds.length) {
      return res.status(400).json({ error: 'A user cannot be selected more than once for the takeover' });
    }

    const primaryCount = newPocs.filter((p) => p.isPrimary).length;
    const secondaryCount = newPocs.length - primaryCount;
    if (primaryCount !== 1 || secondaryCount < 1 || secondaryCount > 2) {
      return res.status(400).json({ error: 'Takeover requires exactly 1 primary and 1-2 secondary POCs' });
    }
    if (!newPocUserIds.includes(toUserId)) {
      return res.status(400).json({ error: 'The new owner must be one of the new POCs' });
    }

    const tokenHash = createHash('sha256').update(token).digest('hex');

    const result = await prisma.$transaction(async (tx) => {
      const takeoverToken = await tx.handoverToken.findUnique({ where: { tokenHash } });
      if (!takeoverToken) {
        throw httpError('Takeover token is invalid', 400);
      }
      if (takeoverToken.reservationId !== req.params.id) {
        throw httpError('Takeover token does not match this reservation', 400);
      }
      if (takeoverToken.usedAt || !takeoverToken.expiresAt || takeoverToken.expiresAt <= new Date()) {
        throw httpError('Takeover token is expired or has already been used', 400);
      }

      const reservation = await findReservationById(tx, req.params.id, { pocs: true });
      if (!reservation) throw httpError('Reservation not found', 404);
      if (reservation.status !== 'ACTIVE') {
        throw httpError('Only an active reservation can be taken over', 409);
      }

      const users = await tx.user.findMany({
        where: { id: { in: [...new Set([...newPocUserIds, toUserId])] } },
        select: { id: true },
      });
      if (users.length !== new Set([...newPocUserIds, toUserId]).size) {
        throw httpError('One or more takeover users do not exist', 400);
      }

      const fromUserId = reservation.currentOwnerId;
      const previousPocUserIds = reservation.pocs.map((poc) => poc.userId);

      const updated = await updateReservationWithEvent(
        tx,
        req.params.id,
        { currentOwnerId: toUserId },
        {
          eventType: isAdminOverride ? 'ADMIN_OVERRIDE_TAKEOVER' : 'TAKEOVER',
          performedBy: performedById,
          fromUserId,
          toUserId,
          metadata: {
            previousPocUserIds,
            newPocUserIds,
            takeoverTokenId: takeoverToken.id,
            ...(reason?.trim() ? { reason: reason.trim() } : {}),
          },
        },
      );

      await tx.reservationPOC.deleteMany({ where: { reservationId: reservation.id } });
      await tx.reservationPOC.createMany({
        data: newPocs.map((poc) => ({
          reservationId: reservation.id,
          userId: poc.userId,
          isPrimary: poc.isPrimary,
        })),
      });

      await tx.handoverToken.update({
        where: { id: takeoverToken.id },
        data: { usedAt: new Date() },
      });
      await tx.handoverToken.deleteMany({
        where: { reservationId: reservation.id, id: { not: takeoverToken.id } },
      });

      return findReservationById(tx, updated.id, { pocs: true, events: true });
    });

    res.json({ ok: true, message: 'Reservation takeover completed successfully.', reservation: result });
  } catch (error) {
    next(error);
  }
});

// Handover ownership
router.post('/:id/handover', async (req, res, next) => {
  try {
    const { toUserId, pocs, reason } = req.body as any;
    if (missingBodyFields(req.body, ['toUserId']).length > 0) {
      return res.status(400).json({ error: 'toUserId is required to hand over a reservation' });
    }
    const performedById = req.user!.id;
    const isAdminOverride = req.user!.role === 'ADMIN';
    if (isAdminOverride && !reason?.trim()) {
      return res.status(400).json({ error: 'A reason is required for an admin override.' });
    }
    if (!Array.isArray(pocs) || pocs.length < 2 || pocs.length > 3) {
      return res.status(400).json({ error: 'Handover requires 1 primary and 1-2 secondary POCs' });
    }

    // Validate POCs
    const newPocs: Array<{ userId: string; isPrimary: boolean }> = pocs;
    if (newPocs.some((p) => !p || typeof p.userId !== 'string' || typeof p.isPrimary !== 'boolean')) {
      return res.status(400).json({ error: 'Each POC must include userId and isPrimary' });
    }

    // Ensure exactly one primary POC and 1-2 secondary POCs
    const newPocUserIds = newPocs.map((p) => p.userId);
    if (new Set(newPocUserIds).size !== newPocUserIds.length) {
      return res.status(400).json({ error: 'A user cannot be selected more than once for the handover' });
    }

    // Validate that there is exactly 1 primary and 1-2 secondary POCs
    const primaryCount = newPocs.filter((p) => p.isPrimary).length;
    const secondaryCount = newPocs.length - primaryCount;
    if (primaryCount !== 1 || secondaryCount < 1 || secondaryCount > 2) {
      return res.status(400).json({ error: 'Handover requires exactly 1 primary and 1-2 secondary POCs' });
    }
    // Ensure the new owner is one of the new POCs
    if (!newPocUserIds.includes(toUserId)) {
      return res.status(400).json({ error: 'The new owner must be one of the new POCs' });
    }

    // Validate that all user IDs exist in the database
    const result = await prisma.$transaction(async (tx) => {
      const reservation = await findReservationById(tx, req.params.id, { pocs: true });
      if (!reservation) throw httpError('Reservation not found', 404);
      if (reservation.status !== 'ACTIVE') {
        throw httpError('Only an active reservation can be handed over', 409);
      }

      if (!isAdminOverride) {
        const isCurrentOwner = reservation.currentOwnerId === performedById;
        const isCurrentPoc = reservation.pocs.some((poc) => poc.userId === performedById);
        if (!isCurrentOwner && !isCurrentPoc) {
          throw httpError('Only the current owner, a POC, or an admin can hand over this reservation', 403);
        }
      }

      const reservationWithPocs = await findReservationById(tx, req.params.id, { pocs: true });
      if (!reservationWithPocs) throw httpError('Reservation not found', 404);

      const users = await tx.user.findMany({
        where: { id: { in: [...new Set([...newPocUserIds, toUserId])] } },
        select: { id: true },
      });
      if (users.length !== new Set([...newPocUserIds, toUserId]).size) {
        throw httpError('One or more new POC users do not exist', 400);
      }

      const fromUserId = reservation.currentOwnerId;
      const previousPocUserIds = reservationWithPocs.pocs.map((poc) => poc.userId);

      // Update reservation with new owner and create handover event
      const updated = await updateReservationWithEvent(
        tx,
        req.params.id,
        { currentOwnerId: toUserId },
        {
          eventType: isAdminOverride ? 'ADMIN_OVERRIDE_HANDOVER' : 'HANDOVER',
          performedBy: performedById,
          fromUserId,
          toUserId,
          metadata: {
            previousPocUserIds,
            newPocUserIds,
            ...(isAdminOverride ? { reason: reason!.trim() } : {}),
          },
        },
      );

      // Update POCs: delete existing POCs and create new ones
      await tx.reservationPOC.deleteMany({ where: { reservationId: reservation.id } });
      await tx.reservationPOC.createMany({
        data: newPocs.map((poc) => ({
          reservationId: reservation.id,
          userId: poc.userId,
          isPrimary: poc.isPrimary,
        })),
      });

      // Return the updated reservation with POCs and events included
      return findReservationById(tx, updated.id, { pocs: true, events: true });
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
