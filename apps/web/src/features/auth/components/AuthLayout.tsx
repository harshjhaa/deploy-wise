import { PropsWithChildren } from "react";
import { NavLink } from "react-router-dom";

export function AuthLayout({ children }: Readonly<PropsWithChildren>) {
  return (
    <main className="auth-layout">
      <section className="auth-brand-panel">
        <NavLink className="brand" to="/login">
          <span className="brand-mark">DW</span>
          <span>DeployWise</span>
        </NavLink>
        <div className="auth-message">
          <p className="eyebrow">Shared environment control</p>
          <h1>Know what is clear before you deploy.</h1>
          <p>
            One place to see ownership, contacts and reservation windows across
            shared environments.
          </p>
        </div>
        <span className="auth-panel-index">01 / ACCESS</span>
      </section>
      <section className="auth-form-panel">{children}</section>
    </main>
  );
}
