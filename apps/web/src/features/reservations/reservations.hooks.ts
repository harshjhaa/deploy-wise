import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTakeoverToken,
  extendReservation,
  fetchReservation,
  handoverReservation,
  redeemTakeoverToken,
  releaseReservation,
} from "./reservations.api";

export function useReservation(id: string) {
  return useQuery({
    queryKey: ["reservation", id],
    queryFn: () => fetchReservation(id),
    enabled: Boolean(id),
  });
}

function useReservationMutation() {
  const queryClient = useQueryClient();
  return { queryClient };
}

export function useReleaseReservation(id: string) {
  const { queryClient } = useReservationMutation();
  return useMutation({
    mutationFn: (reason?: string) => releaseReservation(id, reason),
    onSuccess: () =>
      queryClient
        .invalidateQueries({ queryKey: ["reservation", id] })
        .then(() =>
          queryClient.invalidateQueries({ queryKey: ["dashboard-data"] }),
        ),
  });
}

export function useExtendReservation(id: string) {
  const { queryClient } = useReservationMutation();
  return useMutation({
    mutationFn: (input: { newExpiresAt: string; reason?: string }) =>
      extendReservation(id, input.newExpiresAt, input.reason),
    onSuccess: () =>
      queryClient
        .invalidateQueries({ queryKey: ["reservation", id] })
        .then(() =>
          queryClient.invalidateQueries({ queryKey: ["dashboard-data"] }),
        ),
  });
}

export function useHandoverReservation(id: string) {
  const { queryClient } = useReservationMutation();
  return useMutation({
    mutationFn: (input: {
      toUserId: string;
      pocs: { userId: string; isPrimary: boolean }[];
      reason?: string;
    }) =>
      handoverReservation(id, input.toUserId, input.pocs, input.reason),
    onSuccess: () =>
      queryClient
        .invalidateQueries({ queryKey: ["reservation", id] })
        .then(() =>
          queryClient.invalidateQueries({ queryKey: ["dashboard-data"] }),
        ),
  });
}

export function useCreateTakeoverToken(id: string) {
  const { queryClient } = useReservationMutation();
  return useMutation({
    mutationFn: (reason?: string) => createTakeoverToken(id, reason),
    onSuccess: () =>
      queryClient
        .invalidateQueries({ queryKey: ["reservation", id] })
        .then(() =>
          queryClient.invalidateQueries({ queryKey: ["dashboard-data"] }),
        ),
  });
}

export function useRedeemTakeoverToken(id: string) {
  const { queryClient } = useReservationMutation();
  return useMutation({
    mutationFn: (input: {
      token: string;
      toUserId: string;
      pocs: { userId: string; isPrimary: boolean }[];
      reason?: string;
    }) =>
      redeemTakeoverToken(id, input.token, input.toUserId, input.pocs, input.reason),
    onSuccess: () =>
      queryClient
        .invalidateQueries({ queryKey: ["reservation", id] })
        .then(() =>
          queryClient.invalidateQueries({ queryKey: ["dashboard-data"] }),
        ),
  });
}
