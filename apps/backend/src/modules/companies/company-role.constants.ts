export const ALL_PERMISSIONS = [
  "project.view",
  "project.create",
  "project.update",
  "project.task.manage",
  "project.complete",
  "project.restore",
  "finance.view",
  "finance.update",
  "finance.payment.create",
  "user.view",
  "user.approve",
  "user.reject",
  "user.role.assign",
  "user.remove",
  "role.view",
  "role.create",
  "role.update",
  "notification.view",
  "completed-project.view",
  "completed-project.restore",
  "company.join",
  "company.update",
  "support.manage",
] as const;

export const OFFICE_EMPLOYEE_RESTRICTED = [
  "finance.view",
  "finance.update",
  "finance.payment.create",
  "user.view",
  "user.approve",
  "user.reject",
  "user.role.assign",
  "user.remove",
  "role.view",
  "role.create",
  "role.update",
  "project.task.manage",
  "company.update",
  "support.manage",
] as const;

export const OFFICE_EMPLOYEE_PERMISSIONS = ALL_PERMISSIONS.filter(
  (permission) => !OFFICE_EMPLOYEE_RESTRICTED.includes(permission as (typeof OFFICE_EMPLOYEE_RESTRICTED)[number]),
);

export type OfficeRoleType = "office-manager" | "office-employee";

export const OFFICE_ROLE_CODE_PREFIX: Record<OfficeRoleType, string> = {
  "office-manager": "office-manager-",
  "office-employee": "office-employee-",
};
