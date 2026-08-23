import { Prisma, PrismaClient } from '@prisma/client';

type ReservationDbClient = PrismaClient | Prisma.TransactionClient;

// Checks for missing fields in the request body and returns an array of missing field names
export function missingBodyFields(body: Record<string, unknown>, fields: string[]): string[] {
  return fields.filter((field) => !body[field]);
}

// Finds a reservation by its ID, optionally including related data
export function findReservationById<T extends Prisma.ReservationInclude | undefined>(
  client: ReservationDbClient,
  reservationId: string,
  include?: T,
) {
  return client.reservation.findUnique({ where: { id: reservationId }, include }) as Promise<
    Prisma.ReservationGetPayload<{ include: T }> | null
  >;
}

export function httpError(message: string, status: number): Error & { status: number } {
  return Object.assign(new Error(message), { status });
}

// Finds an active reservation for a POC - by reservation ID and POC user ID
export async function findActiveReservationForPoc(
  tx: Prisma.TransactionClient,
  reservationId: string,
  pocUserId: string,
  operation: string,
) {
  const reservation = await findReservationById(tx, reservationId, {
    pocs: { where: { userId: pocUserId }, select: { id: true } },
  });

  if (!reservation) throw httpError('Reservation not found', 404);
  if (reservation.status !== 'ACTIVE') {
    throw httpError(`Only an active reservation can be ${operation}`, 409);
  }
  if (reservation.pocs.length === 0) {
    throw httpError(`Only a POC can ${operation} this reservation`, 403);
  }

  return reservation;
}

// Creates a reservation event in the database
export function createReservationEvent(
  tx: Prisma.TransactionClient,
  data: Prisma.ReservationEventUncheckedCreateInput,
) {
  return tx.reservationEvent.create({ data });
}

// Updates a reservation and creates a corresponding event in a single transaction
export async function updateReservationWithEvent(
  tx: Prisma.TransactionClient,
  reservationId: string,
  reservationData: Prisma.ReservationUncheckedUpdateInput,
  eventData: Omit<Prisma.ReservationEventUncheckedCreateInput, 'reservationId'>,
) {
  const reservation = await tx.reservation.update({
    where: { id: reservationId },
    data: reservationData,
  });

  await createReservationEvent(tx, { reservationId, ...eventData });
  return reservation;
}
