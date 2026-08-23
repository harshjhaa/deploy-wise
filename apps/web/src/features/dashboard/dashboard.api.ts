import { apiClient } from "../../lib/apiClient";
import {
  DashboardData,
  DashboardEnvironment,
  DashboardGame,
} from "./dashboard.types";

export async function fetchDashboardData(): Promise<DashboardData> {
  const [environments, games] = await Promise.all([
    apiClient.get<DashboardEnvironment[]>("/api/v1/environments"),
    apiClient.get<DashboardGame[]>("/api/v1/games"),
  ]);

  return { environments, games };
}
