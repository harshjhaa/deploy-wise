import { useQuery } from "@tanstack/react-query";
import { fetchDashboardData } from "./dashboard.api";

export function useDashboardData() {
  return useQuery({
    queryKey: ["dashboard-data"],
    queryFn: fetchDashboardData,
    refetchInterval: 30000,
    retry: 1,
  });
}
