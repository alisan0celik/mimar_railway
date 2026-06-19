import { apiClient } from "./client";

export interface RoleDTO {
  id: string;
  name: string;
  code: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  companyId: string;
  userCount: number;
  permissions: string[];
  createdAt: string;
}

export interface RoleDetailDTO extends RoleDTO {
  users: Array<{
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
  }>;
}

export interface CreateRoleInput {
  name: string;
  code: string;
  description?: string;
  icon?: string;
  color?: string;
  permissions?: string[];
}

export interface UpdateRoleInput {
  name?: string;
  code?: string;
  description?: string;
  icon?: string;
  color?: string;
  permissions?: string[];
}

export const rolesApi = {
  getAll: () =>
    apiClient.get<RoleDTO[]>("/roles"),

  getById: (id: string) =>
    apiClient.get<RoleDetailDTO>(`/roles/${id}`),

  create: (data: CreateRoleInput) =>
    apiClient.post<RoleDTO>("/roles", data),

  update: (id: string, data: UpdateRoleInput) =>
    apiClient.patch<RoleDTO>(`/roles/${id}`, data),

  remove: (id: string) =>
    apiClient.delete<{ message: string }>(`/roles/${id}`),

  assignRole: (roleId: string, userId: string) =>
    apiClient.post<{ message: string }>(`/roles/${roleId}/assign/${userId}`),

  removeRole: (roleId: string, userId: string) =>
    apiClient.delete<{ message: string }>(`/roles/${roleId}/assign/${userId}`),
};
