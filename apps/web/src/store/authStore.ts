import { create } from "zustand";
import { AuthUser } from "../features/auth/auth.types";

type AuthState = {
  user: AuthUser | null;
  isHydrated: boolean;
  setUser: (user: AuthUser | null) => void;
  signIn: (user: AuthUser) => void;
  signOut: () => void;
  setHydrated: (isHydrated: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isHydrated: false,
  setUser: (user) => set({ user }),
  signIn: (user) => set({ user }),
  signOut: () => set({ user: null }),
  setHydrated: (isHydrated) => set({ isHydrated }),
}));
