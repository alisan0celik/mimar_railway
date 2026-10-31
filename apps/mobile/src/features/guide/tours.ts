import { PERMISSIONS } from "../../shared/permissions";
import type { ChecklistItem, Tour, TourId } from "./types";

/**
 * Turlar role değil izin koduna bağlı: rol adları şirketten şirkete değişiyor,
 * izin kodları sabit. Bir adımın izni yoksa o kullanıcı için adım atlanır.
 */
export const TOURS: Record<TourId, Tour> = {
  dashboard: {
    id: "dashboard",
    version: 1,
    steps: [
      { id: "logo", target: "dashboard.logo", titleKey: "guide.tours.dashboard.logo.title", bodyKey: "guide.tours.dashboard.logo.body" },
      { id: "bell", target: "dashboard.bell", titleKey: "guide.tours.dashboard.bell.title", bodyKey: "guide.tours.dashboard.bell.body", requires: PERMISSIONS.NOTIFICATION_VIEW },
      { id: "newProject", target: "dashboard.action.new", titleKey: "guide.tours.dashboard.newProject.title", bodyKey: "guide.tours.dashboard.newProject.body", requires: PERMISSIONS.PROJECT_CREATE },
      { id: "projects", target: "dashboard.action.projects", titleKey: "guide.tours.dashboard.projects.title", bodyKey: "guide.tours.dashboard.projects.body", requires: PERMISSIONS.PROJECT_VIEW },
      { id: "finance", target: "dashboard.action.finance", titleKey: "guide.tours.dashboard.finance.title", bodyKey: "guide.tours.dashboard.finance.body", requires: PERMISSIONS.FINANCE_VIEW },
      { id: "pending", target: "dashboard.action.pending", titleKey: "guide.tours.dashboard.pending.title", bodyKey: "guide.tours.dashboard.pending.body", requires: PERMISSIONS.USER_APPROVE },
      { id: "roles", target: "dashboard.action.roles", titleKey: "guide.tours.dashboard.roles.title", bodyKey: "guide.tours.dashboard.roles.body", requires: PERMISSIONS.ROLE_VIEW },
      { id: "notifications", target: "dashboard.action.notif", titleKey: "guide.tours.dashboard.notifications.title", bodyKey: "guide.tours.dashboard.notifications.body", requires: PERMISSIONS.NOTIFICATION_VIEW },
      { id: "tabBar", target: "tab.bar", titleKey: "guide.tours.dashboard.tabBar.title", bodyKey: "guide.tours.dashboard.tabBar.body" },
      { id: "fab", target: "tab.create", titleKey: "guide.tours.dashboard.fab.title", bodyKey: "guide.tours.dashboard.fab.body", requires: PERMISSIONS.PROJECT_CREATE },
      { id: "more", target: "tab.profile", titleKey: "guide.tours.dashboard.more.title", bodyKey: "guide.tours.dashboard.more.body" },
    ],
  },
  projects: {
    id: "projects",
    version: 1,
    requires: PERMISSIONS.PROJECT_VIEW,
    steps: [
      { id: "search", target: "projects.search", titleKey: "guide.tours.projects.search.title", bodyKey: "guide.tours.projects.search.body" },
      { id: "filters", target: "projects.filters", titleKey: "guide.tours.projects.filters.title", bodyKey: "guide.tours.projects.filters.body" },
      { id: "card", target: "projects.firstCard", titleKey: "guide.tours.projects.card.title", bodyKey: "guide.tours.projects.card.body" },
    ],
  },
  projectDetail: {
    id: "projectDetail",
    version: 1,
    requires: PERMISSIONS.PROJECT_VIEW,
    steps: [
      { id: "tabs", target: "projectDetail.tabs", titleKey: "guide.tours.projectDetail.tabs.title", bodyKey: "guide.tours.projectDetail.tabs.body" },
      { id: "search", target: "projectDetail.search", titleKey: "guide.tours.projectDetail.search.title", bodyKey: "guide.tours.projectDetail.search.body" },
      { id: "progress", target: "projectDetail.progress", titleKey: "guide.tours.projectDetail.progress.title", bodyKey: "guide.tours.projectDetail.progress.body", requires: PERMISSIONS.FINANCE_VIEW },
    ],
  },
  createProject: {
    id: "createProject",
    version: 1,
    requires: PERMISSIONS.PROJECT_CREATE,
    steps: [
      { id: "stepper", target: "createProject.stepper", titleKey: "guide.tours.createProject.stepper.title", bodyKey: "guide.tours.createProject.stepper.body" },
      { id: "type", target: "createProject.type", titleKey: "guide.tours.createProject.type.title", bodyKey: "guide.tours.createProject.type.body" },
      { id: "workItems", target: "createProject.workItems", titleKey: "guide.tours.createProject.workItems.title", bodyKey: "guide.tours.createProject.workItems.body" },
    ],
  },
  finance: {
    id: "finance",
    version: 1,
    requires: PERMISSIONS.FINANCE_VIEW,
    steps: [
      { id: "summary", target: "finance.summary", titleKey: "guide.tours.finance.summary.title", bodyKey: "guide.tours.finance.summary.body" },
      { id: "add", target: "finance.add", titleKey: "guide.tours.finance.add.title", bodyKey: "guide.tours.finance.add.body", requires: PERMISSIONS.FINANCE_UPDATE },
      { id: "projects", target: "finance.projects", titleKey: "guide.tours.finance.projects.title", bodyKey: "guide.tours.finance.projects.body" },
    ],
  },
  pendingUsers: {
    id: "pendingUsers",
    version: 1,
    requires: PERMISSIONS.USER_APPROVE,
    steps: [
      { id: "filters", target: "pendingUsers.filters", titleKey: "guide.tours.pendingUsers.filters.title", bodyKey: "guide.tours.pendingUsers.filters.body" },
      { id: "approve", titleKey: "guide.tours.pendingUsers.approve.title", bodyKey: "guide.tours.pendingUsers.approve.body" },
      { id: "roles", titleKey: "guide.tours.pendingUsers.roles.title", bodyKey: "guide.tours.pendingUsers.roles.body", requires: PERMISSIONS.ROLE_VIEW },
    ],
  },
  roles: {
    id: "roles",
    version: 1,
    requires: PERMISSIONS.ROLE_VIEW,
    steps: [
      { id: "defaults", target: "roles.list", titleKey: "guide.tours.roles.defaults.title", bodyKey: "guide.tours.roles.defaults.body" },
      { id: "custom", target: "roles.create", titleKey: "guide.tours.roles.custom.title", bodyKey: "guide.tours.roles.custom.body", requires: PERMISSIONS.ROLE_CREATE },
      { id: "assign", titleKey: "guide.tours.roles.assign.title", bodyKey: "guide.tours.roles.assign.body", requires: PERMISSIONS.USER_ROLE_ASSIGN },
    ],
  },
};

/** "Yeni yetkiler" turunda adımlar bu sırayla dolaşılır. */
export const TOUR_ORDER: TourId[] = [
  "dashboard",
  "projects",
  "projectDetail",
  "createProject",
  "finance",
  "pendingUsers",
  "roles",
];

export const SETUP_CHECKLIST: ChecklistItem[] = [
  { id: "logo", titleKey: "guide.checklist.items.logo", requires: PERMISSIONS.COMPANY_UPDATE, route: "/(main)/settings/company-logo" },
  { id: "project", titleKey: "guide.checklist.items.project", requires: PERMISSIONS.PROJECT_CREATE, route: "/(main)/projects/create", tourId: "createProject" },
  { id: "approve", titleKey: "guide.checklist.items.approve", requires: PERMISSIONS.USER_APPROVE, route: "/(main)/users/pending", tourId: "pendingUsers" },
  { id: "roles", titleKey: "guide.checklist.items.roles", requires: PERMISSIONS.ROLE_VIEW, route: "/(main)/roles", tourId: "roles" },
  { id: "finance", titleKey: "guide.checklist.items.finance", requires: PERMISSIONS.FINANCE_UPDATE, route: "/(main)/(tabs)/finance", tourId: "finance" },
];
