export const SUPPORT_CONTACT_EMAIL = "destek@kozmozinovasyon.com";

export const SUPPORT_WEBSITE_URL = "https://www.kozmozinovasyon.com/";

/** Kullanım kılavuzundaki video anlatım oynatma listesi. */
export const USER_GUIDE_VIDEO_URL =
  "https://www.youtube.com/playlist?list=PLNAMvaZHOI9c";

export const SUPPORT_CATEGORIES = [
  "technical",
  "account",
  "billing",
  "feature_request",
  "other",
] as const;

export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number];

export const CLOSED_TICKET_STATUSES = ["resolved", "closed"] as const;
