import { useEffect } from "react";
import { AppShell } from "./components/layout/AppShell";
import { FoundationPage } from "./features/foundation/FoundationPage";
import { ProfilePage } from "./features/profile/ProfilePage";
import { ReservationDetailsPage } from "./features/reservations/ReservationDetailsPage";
import { LoginPage } from "./features/auth/LoginPage";
import { RegisterPage } from "./features/auth/RegisterPage";
import { ForgotPasswordPage } from "./features/auth/ForgotPasswordPage";
import { ProtectedRoute } from "./features/auth/ProtectedRoute";
import { Route, Routes } from "react-router-dom";
import { fetchCurrentUser } from "./features/auth/auth.api";
import { useAuthStore } from "./store/authStore";

export default function App() {
  const setUser = useAuthStore((state) => state.setUser);
  const setHydrated = useAuthStore((state) => state.setHydrated);

  useEffect(() => {
    let active = true;

    void fetchCurrentUser().then((user) => {
      if (!active) return;
      setUser(user);
      setHydrated(true);
    });

    return () => {
      active = false;
    };
  }, [setUser, setHydrated]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<FoundationPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route
            path="/reservations/:id"
            element={<ReservationDetailsPage />}
          />
        </Route>
      </Route>
    </Routes>
  );
}
