import { tKey } from "../i18n";
import type { PermissionCode } from "./permissions";

export type PermissionMeta = {
  label: string;
  description: string;
  group: string;
};

const PERMISSION_GROUP_ICONS: Record<string, string> = {
  project: "folder-outline",
  finance: "chart-line",
  user: "account-outline",
  role: "shield-account-outline",
  notification: "bell-outline",
  completedProject: "check-circle-outline",
  company: "office-building-outline",
};

function permissionBaseKey(code: PermissionCode): string {
  return `permissions.${code.replace(/\./g, ".")}`;
}

export function getPermissionMeta(code: PermissionCode): PermissionMeta {
  const base = permissionBaseKey(code);
  return {
    label: tKey(`${base}.label`),
    description: tKey(`${base}.description`),
    group: tKey(`${base}.group`),
  };
}

export function getPermissionGroupIcon(groupLabel: string): string {
  const groupKey = Object.entries({
    project: tKey("permissions.groups.project"),
    finance: tKey("permissions.groups.finance"),
    user: tKey("permissions.groups.user"),
    role: tKey("permissions.groups.role"),
    notification: tKey("permissions.groups.notification"),
    completedProject: tKey("permissions.groups.completedProject"),
    company: tKey("permissions.groups.company"),
  }).find(([, label]) => label === groupLabel)?.[0];

  return PERMISSION_GROUP_ICONS[groupKey ?? "project"] ?? "shield-outline";
}

/** @deprecated Use getPermissionMeta(code) for locale-aware labels */
export const PERMISSION_LABELS = new Proxy({} as Record<PermissionCode, PermissionMeta>, {
  get(_target, code: string) {
    if (typeof code !== "string") return undefined;
    return getPermissionMeta(code as PermissionCode);
  },
});

export { PERMISSION_GROUP_ICONS };
