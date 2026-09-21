import { PropsWithChildren } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { logoutUser } from "../../features/auth/auth.api";
import { useAuthStore } from "../../store/authStore";
import "./AppShell.scss";

export function AppShell({ children }: Readonly<PropsWithChildren>) {
  const navigate = useNavigate();
  const signOut = useAuthStore((state) => state.signOut);

  async function handleLogout() {
    try {
      await logoutUser();
    } catch {
      // ignore server errors and still clear local session
    }

    signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink className="brand" to="/" aria-label="DeployWise home">
          <span className="brand-mark">DW</span>
          <span>DeployWise</span>
        </NavLink>
        <nav className="nav" aria-label="Primary navigation">
          <NavLink
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            to="/"
          >
            Overview
          </NavLink>
          <NavLink
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            to="/profile"
          >
            Profile
          </NavLink>
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="environment-label">LOCAL / PHASE 1</span>
          <button className="secondary-button" type="button" onClick={() => void handleLogout()}>
            Logout
          </button>
        </div>
      </header>
      {children ?? <Outlet />}
    </div>
  );
}
