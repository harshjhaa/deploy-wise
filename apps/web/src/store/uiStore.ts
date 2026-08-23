import { create } from "zustand";

type UiState = {
  activeSection: "overview" | "profile";
  setActiveSection: (section: UiState["activeSection"]) => void;
};

export const useUiStore = create<UiState>((set) => ({
  activeSection: "overview",
  setActiveSection: (activeSection) => set({ activeSection }),
}));
