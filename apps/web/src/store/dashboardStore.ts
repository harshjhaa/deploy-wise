import { create } from "zustand";

type DashboardState = {
  search: string;
  availability: "all" | "available" | "reserved";
  setSearch: (search: string) => void;
  setAvailability: (availability: DashboardState["availability"]) => void;
};

export const useDashboardStore = create<DashboardState>((set) => ({
  search: "",
  availability: "all",
  setSearch: (search) => set({ search }),
  setAvailability: (availability) => set({ availability }),
}));
