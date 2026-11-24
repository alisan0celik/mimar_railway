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
  "progress",
  "fieldReports",
  "tender",
  "finance",
  "notifications",
  "support",
] as const;

export type UserGuideSectionId = (typeof USER_GUIDE_SECTION_IDS)[number];

/** Yalnızca belediye modunda gösterilen kılavuz bölümleri. */
export const MUNICIPALITY_ONLY_GUIDE_SECTIONS: readonly UserGuideSectionId[] = ["fieldReports", "tender"];
