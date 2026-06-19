export const PERMISSIONS = {
  PROJECT_VIEW: "project.view",
  PROJECT_CREATE: "project.create",
  PROJECT_UPDATE: "project.update",
  PROJECT_TASK_MANAGE: "project.task.manage",
  PROJECT_COMPLETE: "project.complete",
  PROJECT_RESTORE: "project.restore",

  FINANCE_VIEW: "finance.view",
  FINANCE_UPDATE: "finance.update",
  FINANCE_PAYMENT_CREATE: "finance.payment.create",

  USER_VIEW: "user.view",
  USER_APPROVE: "user.approve",
  USER_REJECT: "user.reject",
  USER_ROLE_ASSIGN: "user.role.assign",
  USER_REMOVE: "user.remove",

  ROLE_VIEW: "role.view",
  ROLE_CREATE: "role.create",
  ROLE_UPDATE: "role.update",

  NOTIFICATION_VIEW: "notification.view",

  COMPLETED_PROJECT_VIEW: "completed-project.view",
  COMPLETED_PROJECT_RESTORE: "completed-project.restore",

  COMPANY_JOIN: "company.join",
  COMPANY_UPDATE: "company.update",
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: PermissionCode[] = Object.values(PERMISSIONS);
