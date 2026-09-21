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
