import { apiClient } from "./client";
import type { UserDTO } from "@mimar/shared";
import {
  buildLogoFormData,
  type CompanyLogoAsset,
  type CreateCompanyResponse,
} from "../../features/company-join/utils/company-form";

export interface CompanyDTO {
  id: string;
  name: string;
  description: string | null;
  city: string | null;
  status: string;
  logoUrl?: string | null;
  logoInitials: string | null;
  subscriptionStatus?: string;
  subscriptionStartedAt?: string;
  subscriptionEndsAt?: string | null;
  blockedReason?: string | null;
  lastActivityAt?: string | null;
  memberCount?: number;
  createdAt: string;
}

export interface PlatformCompanyLicenseDTO {
  id: string;
  name: string;
  city: string | null;
  status: string;
  subscriptionStatus: string;
  subscriptionStartedAt: string;
  subscriptionEndsAt: string | null;
  blockedReason: string | null;
  lastActivityAt: string | null;
  createdAt: string;
  usedDays: number;
  usedMonths: number;
  daysRemaining: number | null;
  memberCount: number;
  projectCount: number;
  owner: {
    id: string;
    fullName: string;
    email: string;
  } | null;
}

export interface UpdateCompanySubscriptionInput {
  subscriptionStatus?: "trial" | "active" | "expired" | "blocked";
  subscriptionEndsAt?: string | null;
  blockedReason?: string | null;
}

export interface CreateCompanyInput {
  name: string;
  description?: string;
  city?: string;
  address?: string;
  phone?: string;
}

export interface JoinRequestInput {
  message?: string;
}

export interface ApproveMemberInput {
  roleId: string;
}

export interface AssignableRoleDTO {
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
  isDefault?: boolean;
}

export interface JoinRequestUserDTO {
  id: string;
  fullName: string;
  email: string;
  title: string | null;
  createdAt: string;
  approvalStatus?: string;
  phone?: string | null;
  companyName?: string | null;
}

export const companiesApi = {
  getAll: () =>
    apiClient.get<CompanyDTO[]>("/companies"),

  getById: (id: string) =>
    apiClient.get<CompanyDTO>(`/companies/${id}`),

  getPlatformLicenses: () =>
    apiClient.get<PlatformCompanyLicenseDTO[]>("/companies/platform/licenses"),

  updatePlatformLicense: (id: string, data: UpdateCompanySubscriptionInput) =>
    apiClient.patch<PlatformCompanyLicenseDTO>(`/companies/platform/licenses/${id}`, data),

  create: (data: CreateCompanyInput) =>
    apiClient.post<CreateCompanyResponse>("/companies", data),

  uploadLogo: (companyId: string, asset: CompanyLogoAsset) =>
    apiClient.patch<{ id: string; logoUrl: string }>(
      `/companies/${companyId}/logo`,
      buildLogoFormData(asset),
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    ),

  update: (id: string, data: Partial<CreateCompanyInput>) =>
    apiClient.patch(`/companies/${id}`, data),

  requestJoin: (companyId: string, data?: JoinRequestInput) =>
    apiClient.post<{ message: string; accessToken?: string; refreshToken?: string; user?: UserDTO }>(
      `/companies/${companyId}/join-request`,
      data || {},
    ),

  getJoinRequests: (companyId: string) =>
    apiClient.get(`/companies/${companyId}/join-requests`),

  getAssignableRoles: (companyId: string) =>
    apiClient.get<AssignableRoleDTO[]>(`/companies/${companyId}/assignable-roles`),

  approveMember: (companyId: string, userId: string, data: ApproveMemberInput) =>
    apiClient.patch(`/companies/${companyId}/approve/${userId}`, data),

  rejectMember: (companyId: string, userId: string) =>
    apiClient.patch(`/companies/${companyId}/reject/${userId}`),
};
