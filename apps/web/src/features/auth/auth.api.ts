import { apiClient } from "../../lib/apiClient";
import { AuthUser } from "./auth.types";

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const response = await apiClient.get<{ user: AuthUser | null }>("/api/v1/auth/me");
    return response.user ?? null;
  } catch {
    return null;
  }
}

export async function loginUser(email: string, password: string) {
  return apiClient.post<{ user: AuthUser }>("/api/v1/auth/login", {
    email,
    password,
  });
}

export async function registerUser(name: string, email: string, password: string) {
  return apiClient.post<{ user: AuthUser }>("/api/v1/auth/register", {
    name,
    email,
    password,
  });
}

export async function logoutUser() {
  return apiClient.post<{ ok: boolean }>("/api/v1/auth/logout");
}

export async function requestPasswordReset(email: string) {
  return apiClient.post<{ ok: boolean; message: string; resetToken?: string }>("/api/v1/auth/forgot-password", {
    email,
  });
}

export async function resetPasswordWithToken(token: string, newPassword: string, confirmPassword: string) {
  return apiClient.post<{ ok: boolean; message: string }>("/api/v1/auth/reset-password-token", {
    token,
    newPassword,
    confirmPassword,
  });
}

export async function resetPassword(newPassword: string, confirmPassword: string) {
  return apiClient.post<{ ok: boolean; message: string }>("/api/v1/auth/reset-password", {
    newPassword,
    confirmPassword,
  });
}
