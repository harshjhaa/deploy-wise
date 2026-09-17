import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  extendReservation,
  fetchReservation,
  handoverReservation,
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
    mutationFn: (performedById: string) =>
      releaseReservation(id, performedById),
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
    mutationFn: (input: { newExpiresAt: string; performedById: string }) =>
      extendReservation(id, input.newExpiresAt, input.performedById),
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
      performedById: string;
      toUserId: string;
      pocs: { userId: string; isPrimary: boolean }[];
    }) =>
      handoverReservation(id, input.performedById, input.toUserId, input.pocs),
    onSuccess: () =>
      queryClient
        .invalidateQueries({ queryKey: ["reservation", id] })
        .then(() =>
          queryClient.invalidateQueries({ queryKey: ["dashboard-data"] }),
        ),
  });
}
