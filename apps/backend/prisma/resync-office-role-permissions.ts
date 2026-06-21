import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import * as path from "path";
import {
  ALL_PERMISSIONS,
  OFFICE_EMPLOYEE_PERMISSIONS,
} from "../src/modules/companies/company-role.constants";
import { ensureDefaultOfficeRoles } from "../src/modules/companies/company-default-roles.util";

dotenv.config({ path: path.join(__dirname, "../.env") });

const prisma = new PrismaClient();

function makeId(prefix: string, roleId: string, permission: string) {
  return `${prefix}_${roleId.slice(-8)}_${permission.replace(/\./g, "_")}`;
}

async function resyncRolePermissions(
  codePrefix: string,
  permissions: readonly string[],
) {
  const roles = await prisma.role.findMany({
    where: { code: { startsWith: codePrefix } },
    select: { id: true, code: true, companyId: true },
  });

  for (const role of roles) {
    await prisma.rolePermission.deleteMany({
      where: {
        roleId: role.id,
        permission: { notIn: [...permissions] },
      },
    });

    for (const permission of permissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permission: { roleId: role.id, permission },
        },
        create: {
          id: makeId("rp", role.id, permission),
          roleId: role.id,
          permission,
        },
        update: {},
      });
    }
  }

  return roles.map((r) => r.id);
}

async function syncUsersForRoles(roleIds: string[]) {
  if (roleIds.length === 0) return 0;

  const userRoles = await prisma.userRole.findMany({
    where: { roleId: { in: roleIds } },
    select: { userId: true },
  });

  const userIds = [...new Set(userRoles.map((ur) => ur.userId))];

  for (const userId of userIds) {
    const roles = await prisma.userRole.findMany({
      where: { userId },
      include: { role: { include: { permissions: true } } },
    });

    const rolePermissions = Array.from(
      new Set(
        roles.flatMap((ur) => ur.role.permissions.map((rp) => rp.permission)),
      ),
    );

    await prisma.userPermission.deleteMany({ where: { userId } });

    if (rolePermissions.length > 0) {
      await prisma.userPermission.createMany({
        data: rolePermissions.map((permission) => ({
          id: makeId("up", userId, permission),
          userId,
          permission,
        })),
        skipDuplicates: true,
      });
    }
  }

  return userIds.length;
}

async function main() {
  console.log("Varsayılan ofis rolleri kontrol ediliyor...");

  const companies = await prisma.company.findMany({ select: { id: true, name: true } });
  for (const company of companies) {
    await ensureDefaultOfficeRoles(prisma, company.id);
    console.log(`  ✓ ${company.name}`);
  }

  console.log("Ofis rol izinleri senkronize ediliyor...");

  const managerRoleIds = await resyncRolePermissions("office-manager-", ALL_PERMISSIONS);
  const ownerRoleIds = await resyncRolePermissions("owner-", ALL_PERMISSIONS);
  const employeeRoleIds = await resyncRolePermissions(
    "office-employee-",
    OFFICE_EMPLOYEE_PERMISSIONS,
  );

  const syncedUsers = await syncUsersForRoles([
    ...managerRoleIds,
    ...ownerRoleIds,
    ...employeeRoleIds,
  ]);

  console.log(
    `Tamamlandı: ${companies.length} şirket, ${ownerRoleIds.length} sahip rolü, ${managerRoleIds.length} yönetici rolü, ${employeeRoleIds.length} çalışan rolü, ${syncedUsers} kullanıcı güncellendi.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
