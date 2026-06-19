export const SUPPORT_CATEGORIES = [
  "technical",
  "account",
  "billing",
  "feature_request",
  "other",
] as const;

export const SUPPORT_PRIORITIES = ["low", "normal", "high"] as const;

export const SUPPORT_STATUSES = [
  "open",
  "in_progress",
  "waiting_user",
  "resolved",
  "closed",
] as const;

export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number];
export type SupportPriority = (typeof SUPPORT_PRIORITIES)[number];
export type SupportStatus = (typeof SUPPORT_STATUSES)[number];

export const CLOSED_SUPPORT_STATUSES: SupportStatus[] = ["resolved", "closed"];
