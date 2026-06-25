import { apiClient } from "./client";
import type { AuthResponse } from "@mimar/shared";

export const authApi = {
  register: (data: { email: string; password: string; fullName: string }) =>
    apiClient.post<AuthResponse>("/auth/register", data),

  checkEmail: (email: string) =>
    apiClient.get<{ exists: boolean }>("/auth/check-email", { params: { email } }),

  login: (data: { email: string; password: string }) =>
    apiClient.post<AuthResponse>("/auth/login", data),

  socialLogin: (data: { provider: "GOOGLE" | "APPLE" | "MICROSOFT"; idToken: string }) =>
    apiClient.post<AuthResponse>("/auth/social", data),

  refreshToken: (refreshToken: string) =>
    apiClient.post<AuthResponse>("/auth/refresh", { refreshToken }),

  logout: () =>
    apiClient.post("/auth/logout"),

  forgotPassword: (email: string) =>
    apiClient.post("/auth/forgot-password", { email }),

  resetPassword: (data: { token: string; newPassword: string }) =>
    apiClient.post("/auth/reset-password", data),

  getMe: () =>
    apiClient.get("/auth/me"),
};
