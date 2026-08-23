import { PropsWithChildren } from "react";
import { NavLink } from "react-router-dom";
import "./AppShell.scss";

export function AppShell({ children }: Readonly<PropsWithChildren>) {
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
        <span className="environment-label">LOCAL / PHASE 1</span>
      </header>
      {children}
    </div>
  );
}
