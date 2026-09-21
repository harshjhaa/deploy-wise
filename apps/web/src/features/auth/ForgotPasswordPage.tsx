import { FormEvent, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { forgotPassword } from "./auth.api";
import { AuthLayout } from "./components/AuthLayout";
import { AuthField } from "./components/AuthField";
import "./AuthPage.scss";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim() || !newPassword || !confirmPassword) {
      setError("Email, new password, and confirmation are required.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await forgotPassword(email.trim(), newPassword, confirmPassword);
      setSuccess("Password reset successfully. You can now sign in.");
      setTimeout(() => {
        navigate("/login");
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password reset failed.");
    }
  }

  return (
    <AuthLayout>
      <div className="auth-card">
        <p className="eyebrow">Reset access</p>
        <h2>Forgot password</h2>
        <p className="auth-subtitle">
          No old password or OTP required. Just provide your email and a new password.
        </p>

        <form className="auth-form" onSubmit={submit}>
          {error && <p className="auth-error" role="alert">{error}</p>}
          {success && <p className="auth-error" role="status" style={{ background: "#1d3829", color: "#bfe7c7" }}>{success}</p>}

          <AuthField
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
          />

          <AuthField
            id="newPassword"
            label="New password"
            type="password"
            value={newPassword}
            onChange={setNewPassword}
            autoComplete="new-password"
          />

          <AuthField
            id="confirmPassword"
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
          />

          <button className="auth-submit" type="submit">
            Reset password
          </button>
        </form>

        <p className="auth-switch">
          Back to <NavLink to="/login">sign in</NavLink>
        </p>
      </div>
    </AuthLayout>
  );
}
