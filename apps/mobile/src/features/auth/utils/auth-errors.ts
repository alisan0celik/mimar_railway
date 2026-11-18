const SUBSCRIPTION_BLOCK_CODES = new Set([
  "COMPANY_SUBSCRIPTION_EXPIRED",
  "COMPANY_SUBSCRIPTION_BLOCKED",
  "COMPANY_INACTIVE",
]);

const SUBSCRIPTION_MESSAGE_KEYS: Record<string, string> = {
  COMPANY_SUBSCRIPTION_EXPIRED: "auth.errors.subscriptionExpired",
  COMPANY_SUBSCRIPTION_BLOCKED: "auth.errors.subscriptionBlocked",
  COMPANY_INACTIVE: "auth.errors.companyInactive",
};

type Translate = (key: string, params?: Record<string, string | number>) => string;

export function getLoginErrorMessage(error: any, t: Translate) {
  const code = error?.response?.data?.code;
  if (code && SUBSCRIPTION_MESSAGE_KEYS[code]) {
    return t(SUBSCRIPTION_MESSAGE_KEYS[code]);
  }
  if ((code && SUBSCRIPTION_BLOCK_CODES.has(code)) || error?.response?.status === 403) {
    return t("auth.errors.subscriptionRenewRequired");
  }
  return error?.response?.data?.message || t("auth.errors.invalidCredentials");
}

/** Backend'den gelen hata mı (sunucu yanıtı var), yoksa SDK/ağ hatası mı? */
export function isApiError(error: any): boolean {
  return Boolean(error?.response);
}
