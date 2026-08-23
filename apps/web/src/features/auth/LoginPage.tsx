import { FormEvent, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { AuthLayout } from "./components/AuthLayout";
import { AuthField } from "./components/AuthField";
import { useAuthStore } from "../../store/authStore";
import "./AuthPage.scss";

export function LoginPage() {
  const navigate = useNavigate();
  const signIn = useAuthStore((state) => state.signIn);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || !password)
      return setError("Enter your email and password.");
    signIn({ name: email.split("@")[0], email: email.trim() });
    navigate("/");
  }

  return (
    <AuthLayout>
      <div className="auth-card">
        <p className="eyebrow">Welcome back</p>
        <h2>Sign in</h2>
        <p className="auth-subtitle">
          Access your shared environment workspace.
        </p>
        <form className="auth-form" onSubmit={submit}>
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}
          <AuthField
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
          />
          <AuthField
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
          />
          <button className="auth-submit" type="submit">
            Continue
          </button>
        </form>
        <p className="auth-switch">
          New here? <NavLink to="/register">Create an account</NavLink>
        </p>
      </div>
    </AuthLayout>
  );
}
