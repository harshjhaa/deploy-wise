import { apiClient } from "../../lib/apiClient";

export type DeploymentRequest = {
  id: string;
  reservationId: string;
  branch: string;
  deployType: string;
  status: string;
  buildStatus: string | null;
  deployStatus: string | null;
  pipelineId: string | null;
  pipelineUrl: string | null;
  buildJobId: string | null;
  deployJobId: string | null;
  createdAt: string;
  updatedAt: string;
};

export function fetchDeploymentRequests(reservationId: string) {
  return apiClient.get<DeploymentRequest[]>("/api/v1/deployments", {
    params: { reservationId },
  });
}

export function createDeploymentRequest(reservationId: string, branch: string) {
  return apiClient.post<{
    requestId: string;
    status: string;
    pipelineId: string;
    pipelineUrl: string;
    buildJobId: string;
    buildJobName: string;
  }>("/api/v1/deployments", { reservationId, branch });
}

export function startStressOneDeployment(requestId: string) {
  return apiClient.post<{
    requestId: string;
    status: string;
    pipelineUrl: string | null;
    deployJobId: string;
    deployJobName: string;
    deployStatus: string;
  }>(`/api/v1/deployments/${requestId}/deploy`);
}
