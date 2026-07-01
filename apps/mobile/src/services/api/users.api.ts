import { apiClient } from "./client";

export interface UserDTO {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  authProvider: string;
  approvalStatus: string;
  title: string | null;
  companyId: string | null;
  companyName: string | null;
  isPlatformAdmin?: boolean;
  companySubscription?: {
    status: string | null;
    startedAt: string | null;
    endsAt: string | null;
    blockedReason: string | null;
    lastActivityAt: string | null;
  } | null;
  roles: Array<{ id: string; name: string; code: string }>;
  permissions: string[];
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const usersApi = {
  getAll: (params?: { page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<UserDTO>>("/users", { params }),

  getById: (id: string) =>
    apiClient.get<UserDTO>(`/users/${id}`),

  updateStatus: (id: string, status: string) =>
    apiClient.patch(`/users/${id}/status`, { status }),

  assignRole: (userId: string, roleId: string) =>
    apiClient.patch(`/users/${userId}/role`, { roleId }),

  getTeamMembers: () =>
    apiClient.get<UserDTO[]>("/users/team"),

  replaceRole: (userId: string, roleId: string) =>
    apiClient.put<UserDTO>(`/users/${userId}/role`, { roleId }),

  removeFromCompany: (userId: string) =>
    apiClient.delete<{ message: string }>(`/users/${userId}/membership`),

  updateProfile: (data: { fullName?: string; phone?: string; title?: string }) =>
    apiClient.patch<UserDTO>("/users/profile", data),

  updateNotificationPrefs: (prefs: any) =>
    apiClient.patch("/users/notification-preferences", { notificationPreferences: prefs }),

  deleteAccount: () =>
    apiClient.delete<{ message: string }>("/users/me"),
};
