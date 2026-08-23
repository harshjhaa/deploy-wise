import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createReservation,
  CreateReservationPayload,
  fetchDashboardData,
} from "./dashboard.api";

export function useDashboardData() {
  return useQuery({
    queryKey: ["dashboard-data"],
    queryFn: fetchDashboardData,
    refetchInterval: 30000,
    retry: 1,
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReservationPayload) =>
      createReservation(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] }),
  });
}
