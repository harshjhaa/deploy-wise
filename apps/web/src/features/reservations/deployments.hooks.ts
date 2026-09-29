import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDeploymentRequest,
  fetchDeploymentRequests,
  startStressOneDeployment,
} from "./deployments.api";

const POLLING_STATUSES = new Set([
  "BUILD_PENDING",
  "BUILD_RUNNING",
  "DEPLOY_PENDING",
  "DEPLOY_RUNNING",
]);

export function useDeploymentRequests(reservationId: string) {
  return useQuery({
    queryKey: ["deployment-requests", reservationId],
    queryFn: () => fetchDeploymentRequests(reservationId),
    enabled: Boolean(reservationId),
    refetchInterval: (query) => {
      const latest = query.state.data?.[0];
      return latest && POLLING_STATUSES.has(latest.status) ? 4000 : false;
    },
  });
}

export function useCreateDeploymentRequest(reservationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (branch: string) => createDeploymentRequest(reservationId, branch),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["deployment-requests", reservationId],
      }),
  });
}

export function useStartStressOneDeployment(reservationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => startStressOneDeployment(requestId),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["deployment-requests", reservationId],
      }),
  });
}
