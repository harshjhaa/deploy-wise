import { apiClient } from "../../lib/apiClient";
import { ReservationDetail } from "./reservations.types";

export function fetchReservation(id: string) {
  return apiClient.get<ReservationDetail>(`/api/v1/reservations/${id}`);
}

export function releaseReservation(id: string, performedById: string) {
  return apiClient.post(`/api/v1/reservations/${id}/release`, {
    performedById,
  });
}

export function extendReservation(
  id: string,
  newExpiresAt: string,
  performedById: string,
) {
  return apiClient.post(`/api/v1/reservations/${id}/extend`, {
    newExpiresAt,
    performedById,
  });
}

export function handoverReservation(
  id: string,
  performedById: string,
  toUserId: string,
  pocs: { userId: string; isPrimary: boolean }[],
) {
  return apiClient.post(`/api/v1/reservations/${id}/handover`, {
    performedById,
    toUserId,
    pocs,
  });
}
