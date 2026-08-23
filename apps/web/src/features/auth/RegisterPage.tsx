import { FormEvent, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { AuthLayout } from "./components/AuthLayout";
import { AuthField } from "./components/AuthField";
import { useAuthStore } from "../../store/authStore";
import "./AuthPage.scss";

export function RegisterPage() {
  const navigate = useNavigate();
  const signIn = useAuthStore((state) => state.signIn);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !email.trim() || password.length < 8) {
      return setError(
        "Enter your name, email, and a password of at least 8 characters.",
      );
    }
    signIn({ name: name.trim(), email: email.trim() });
    navigate("/");
  }

  return (
    <AuthLayout>
      <div className="auth-card">
        <p className="eyebrow">Get started</p>
        <h2>Create account</h2>
        <p className="auth-subtitle">
          Set up your workspace identity for local development.
        </p>
        <form className="auth-form" onSubmit={submit}>
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}
          <AuthField
            id="name"
            label="Name"
            value={name}
            onChange={setName}
            autoComplete="name"
          />
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
            autoComplete="new-password"
          />
          <button className="auth-submit" type="submit">
            Create account
          </button>
        </form>
        <p className="auth-switch">
          Already registered? <NavLink to="/login">Sign in</NavLink>
        </p>
      </div>
    </AuthLayout>
  );
}
