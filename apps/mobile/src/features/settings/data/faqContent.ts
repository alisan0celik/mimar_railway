export const FAQ_ITEM_IDS = [
  "gettingStarted",
  "joinCompany",
  "projectTeam",
  "todos",
  "notifications",
  "roles",
] as const;

export type FaqItemId = (typeof FAQ_ITEM_IDS)[number];

export const USER_GUIDE_SECTION_IDS = [
  "projects",
  "team",
  "todos",
  "finance",
  "notifications",
  "support",
] as const;

export type UserGuideSectionId = (typeof USER_GUIDE_SECTION_IDS)[number];
