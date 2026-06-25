import { ApprovalStatus, AuthProvider } from "../enums";

export interface UserDTO {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  authProvider: AuthProvider;
  approvalStatus: ApprovalStatus;
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
  roles: UserRoleDTO[];
  permissions: string[];
  createdAt: string;
}

export interface UserRoleDTO {
  id: string;
  name: string;
  code: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface SocialLoginInput {
  provider: AuthProvider.GOOGLE | AuthProvider.APPLE | AuthProvider.MICROSOFT;
  idToken: string;
}
