import { ForbiddenException } from "@nestjs/common";

export const COMPANY_SUBSCRIPTION_EXPIRED = "COMPANY_SUBSCRIPTION_EXPIRED";
export const COMPANY_SUBSCRIPTION_BLOCKED = "COMPANY_SUBSCRIPTION_BLOCKED";
export const COMPANY_INACTIVE = "COMPANY_INACTIVE";

type CompanySubscriptionFields = {
  status?: string | null;
  subscriptionStatus?: string | null;
  subscriptionEndsAt?: Date | string | null;
  blockedReason?: string | null;
};

export function getPlatformAdminEmails(): string[] {
  const raw = process.env.PLATFORM_ADMIN_EMAILS || "admin@mimar.com";
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isPlatformAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return getPlatformAdminEmails().includes(email.toLowerCase());
}

export function getCompanySubscriptionBlock(company: CompanySubscriptionFields) {
  if (company.status && company.status !== "active") {
    return {
      code: COMPANY_INACTIVE,
      message: "Şirket hesabınız şu anda aktif değildir. Lütfen platform yöneticisiyle iletişime geçin.",
    };
  }

  if (company.subscriptionStatus === "blocked") {
      return {
        code: COMPANY_SUBSCRIPTION_BLOCKED,
        message:
          company.blockedReason ||
             "Üyeliğiniz pasif veya süresi dolmuş. Lütfen üyeliğinizi yenileyin.",
      };
  }

  const endsAt = company.subscriptionEndsAt ? new Date(company.subscriptionEndsAt) : null;
  const isExpiredStatus = company.subscriptionStatus === "expired";
  const isPastEnd = Boolean(endsAt && endsAt.getTime() < Date.now());

  if (isExpiredStatus || isPastEnd) {
      return {
        code: COMPANY_SUBSCRIPTION_EXPIRED,
        message: "Üyeliğiniz pasif veya süresi dolmuş. Lütfen üyeliğinizi yenileyin.",
      };
  }

  return null;
}

export function throwIfCompanySubscriptionBlocked(company: CompanySubscriptionFields) {
  const block = getCompanySubscriptionBlock(company);
  if (!block) return;
  throw new ForbiddenException(block);
}
