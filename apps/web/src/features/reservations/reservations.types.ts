export type ReservationPoc = {
  id: string;
  userId: string;
  isPrimary: boolean;
};

export type ReservationEvent = {
  id: string;
  eventType: string;
  performedBy: string;
  fromUserId: string | null;
  toUserId: string | null;
  oldExpiresAt: string | null;
  newExpiresAt: string | null;
  metadata: unknown;
  createdAt: string;
};

export type ReservationDetail = {
  id: string;
  environmentId: string;
  gameId: string;
  currentOwnerId: string;
  status: string;
  reservedAt: string;
  expiresAt: string;
  releasedAt: string | null;
  pocs: ReservationPoc[];
  events: ReservationEvent[];
};
