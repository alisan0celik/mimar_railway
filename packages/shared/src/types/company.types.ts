import { CompanyStatus } from "../enums";

export interface CompanyDTO {
  id: string;
  name: string;
  description: string | null;
  city: string | null;
  address: string | null;
  phone: string | null;
  logoUrl: string | null;
  logoInitials: string | null;
  status: CompanyStatus;
  ownerId: string;
  memberCount: number;
  activeProjectCount: number;
  createdAt: string;
}
