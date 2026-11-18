import { PERMISSIONS } from "../../shared/permissions";
import type { ChecklistItem, Tour, TourId } from "./types";

/**
 * Turlar role değil izin koduna bağlı: rol adları şirketten şirkete değişiyor,
 * izin kodları sabit. Bir adımın izni yoksa o kullanıcı için adım atlanır.
 * Her tur en fazla iki adımdır ve yalnızca o ekranın çekirdek nesnesini gösterir.
 */
export const TOURS: Record<TourId, Tour> = {
  projects: {
    id: "projects",
    version: 2,
    requires: PERMISSIONS.PROJECT_VIEW,
    steps: [
      {
        id: "card",
        target: "projects.firstCard",
        titleKey: "guide.tours.projects.card.title",
        bodyKey: "guide.tours.projects.card.body",
      },
    ],
  },
  projectDetail: {
    id: "projectDetail",
    version: 2,
    requires: PERMISSIONS.PROJECT_VIEW,
    steps: [
      {
        id: "tabs",
        target: "projectDetail.tabs",
        titleKey: "guide.tours.projectDetail.tabs.title",
        bodyKey: "guide.tours.projectDetail.tabs.body",
      },
      {
        id: "progress",
        target: "projectDetail.progress",
        titleKey: "guide.tours.projectDetail.progress.title",
        bodyKey: "guide.tours.projectDetail.progress.body",
        requires: PERMISSIONS.FINANCE_VIEW,
      },
    ],
  },
  createProject: {
    id: "createProject",
    version: 2,
    requires: PERMISSIONS.PROJECT_CREATE,
    steps: [
      {
        id: "workItems",
        target: "createProject.workItems",
        titleKey: "guide.tours.createProject.workItems.title",
        bodyKey: "guide.tours.createProject.workItems.body",
      },
    ],
  },
  finance: {
    id: "finance",
    version: 2,
    requires: PERMISSIONS.FINANCE_VIEW,
    steps: [
      {
        id: "summary",
        target: "finance.summary",
        titleKey: "guide.tours.finance.summary.title",
        bodyKey: "guide.tours.finance.summary.body",
      },
    ],
  },
};

export const SETUP_CHECKLIST: ChecklistItem[] = [
  { id: "logo", titleKey: "guide.checklist.items.logo", requires: PERMISSIONS.COMPANY_UPDATE, route: "/(main)/settings/company-logo" },
  { id: "project", titleKey: "guide.checklist.items.project", requires: PERMISSIONS.PROJECT_CREATE, route: "/(main)/projects/create", tourId: "createProject" },
  { id: "approve", titleKey: "guide.checklist.items.approve", requires: PERMISSIONS.USER_APPROVE, route: "/(main)/users/pending" },
  { id: "roles", titleKey: "guide.checklist.items.roles", requires: PERMISSIONS.ROLE_VIEW, route: "/(main)/roles" },
  { id: "finance", titleKey: "guide.checklist.items.finance", requires: PERMISSIONS.FINANCE_UPDATE, route: "/(main)/(tabs)/finance", tourId: "finance" },
];
