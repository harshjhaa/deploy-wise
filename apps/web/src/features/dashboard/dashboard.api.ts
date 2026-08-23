import { apiClient } from "../../lib/apiClient";
import {
  DashboardData,
  DashboardEnvironment,
  DashboardGame,
  DashboardUser,
} from "./dashboard.types";

export async function fetchDashboardData(): Promise<DashboardData> {
  const [environments, games, users] = await Promise.all([
    apiClient.get<DashboardEnvironment[]>("/api/v1/environments"),
    apiClient.get<DashboardGame[]>("/api/v1/games"),
    apiClient.get<DashboardUser[]>("/api/v1/users"),
  ]);

  return { environments, games, users };
}

export type CreateReservationPayload = {
  environmentId: string;
  gameId: string;
  currentOwnerId: string;
  createdById: string;
  expiresAt: string;
  pocs: { userId: string; isPrimary: boolean }[];
};

export async function createReservation(payload: CreateReservationPayload) {
  return apiClient.post("/api/v1/reservations", payload);
}
