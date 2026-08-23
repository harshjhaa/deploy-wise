import { PropsWithChildren } from "react";
import { useUiStore } from "../../store/uiStore";
import "./AppShell.scss";

export function AppShell({ children }: Readonly<PropsWithChildren>) {
  const activeSection = useUiStore((state) => state.activeSection);
  const setActiveSection = useUiStore((state) => state.setActiveSection);

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="DeployWise home">
          <span className="brand-mark">DW</span>
          <span>DeployWise</span>
        </a>
        <nav className="nav" aria-label="Primary navigation">
          <a
            className={`nav-link ${activeSection === "overview" ? "active" : ""}`}
            href="/"
            onClick={() => setActiveSection("overview")}
          >
            Overview
          </a>
          <a
            className={`nav-link ${activeSection === "profile" ? "active" : ""}`}
            href="/profile"
            onClick={() => setActiveSection("profile")}
          >
            Profile
          </a>
        </nav>
        <span className="environment-label">LOCAL / PHASE 1</span>
      </header>
      {children}
    </div>
  );
}
