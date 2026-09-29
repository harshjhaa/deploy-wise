import { apiClient } from "../../lib/apiClient";
import { ReservationDetail } from "./reservations.types";

export function fetchReservation(id: string) {
  return apiClient.get<ReservationDetail>(`/api/v1/reservations/${id}`);
}

export function releaseReservation(id: string, reason?: string) {
  return apiClient.post(`/api/v1/reservations/${id}/release`, { reason });
}

export function extendReservation(
  id: string,
  newExpiresAt: string,
  reason?: string,
) {
  return apiClient.post(`/api/v1/reservations/${id}/extend`, {
    newExpiresAt,
    reason,
  });
}

export function handoverReservation(
  id: string,
  toUserId: string,
  pocs: { userId: string; isPrimary: boolean }[],
  reason?: string,
) {
  return apiClient.post(`/api/v1/reservations/${id}/handover`, {
    toUserId,
    pocs,
    reason,
  });
}

export function createTakeoverToken(id: string, reason?: string) {
  return apiClient.post<{ ok: boolean; message: string; token?: string; tokenId: string; expiresAt: string }>(
    `/api/v1/reservations/${id}/takeover-token`,
    { reason },
  );
}

export function redeemTakeoverToken(
  id: string,
  token: string,
  toUserId: string,
  pocs: { userId: string; isPrimary: boolean }[],
  reason?: string,
) {
  return apiClient.post(`/api/v1/reservations/${id}/redeem-takeover`, {
    token,
    toUserId,
    pocs,
    reason,
  });
}
