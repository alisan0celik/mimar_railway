export const SUPPORT_CONTACT_EMAIL = "destek@mimarlik.app";

export const SUPPORT_CATEGORIES = [
  "technical",
  "account",
  "billing",
  "feature_request",
  "other",
] as const;

export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number];

export const CLOSED_TICKET_STATUSES = ["resolved", "closed"] as const;
