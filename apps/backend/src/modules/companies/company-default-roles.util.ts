import type { PrismaClient } from "@prisma/client";
import {
  ALL_PERMISSIONS,
  OFFICE_EMPLOYEE_PERMISSIONS,
  OFFICE_ROLE_CODE_PREFIX,
} from "./company-role.constants";

type DbClient = Pick<PrismaClient, "role" | "rolePermission">;

export const DEFAULT_OFFICE_MANAGER_META = {
  name: "Ofis Yöneticisi",
  description: "Finans ve kullanıcı yönetimi dahil tüm yetkilere sahiptir",
  icon: "account-tie",
  color: "#2563EB",
} as const;

export const DEFAULT_OFFICE_EMPLOYEE_META = {
  name: "Ofis Çalışanı",
  description: "Finans, kullanıcı onay ve rol yönetimi hariç temel yetkilere sahiptir",
  icon: "account",
  color: "#10B981",
} as const;

async function syncRolePermissions(
  db: DbClient,
  roleId: string,
  permissions: readonly string[],
) {
  await db.rolePermission.deleteMany({
    where: {
      roleId,
      permission: { notIn: [...permissions] },
    },
  });

  for (const permission of permissions) {
    await db.rolePermission.upsert({
      where: {
        roleId_permission: { roleId, permission },
      },
      create: { roleId, permission },
      update: {},
    });
  }
}

async function ensureOfficeRole(
  db: DbClient,
  companyId: string,
  codePrefix: string,
  meta: typeof DEFAULT_OFFICE_MANAGER_META | typeof DEFAULT_OFFICE_EMPLOYEE_META,
  permissions: readonly string[],
) {
  const code = `${codePrefix}${companyId.slice(-6)}`;
  let role = await db.role.findFirst({
    where: {
      companyId,
      code: { startsWith: codePrefix },
    },
  });

  if (!role) {
    role = await db.role.create({
      data: {
        name: meta.name,
        code,
        description: meta.description,
        icon: meta.icon,
        color: meta.color,
        companyId,
        permissions: {
          create: permissions.map((permission) => ({ permission })),
        },
      },
    });
    return role;
  }

  await db.role.update({
    where: { id: role.id },
    data: {
      name: meta.name,
      description: meta.description,
      icon: meta.icon,
      color: meta.color,
    },
  });

  await syncRolePermissions(db, role.id, permissions);
  return role;
}

export async function ensureDefaultOfficeRoles(db: DbClient, companyId: string) {
  await ensureOfficeRole(
    db,
    companyId,
    OFFICE_ROLE_CODE_PREFIX["office-manager"],
    DEFAULT_OFFICE_MANAGER_META,
    ALL_PERMISSIONS,
  );

  await ensureOfficeRole(
    db,
    companyId,
    OFFICE_ROLE_CODE_PREFIX["office-employee"],
    DEFAULT_OFFICE_EMPLOYEE_META,
    OFFICE_EMPLOYEE_PERMISSIONS,
  );
}

export function isOwnerRoleCode(code: string): boolean {
  return code.startsWith("owner-");
}
