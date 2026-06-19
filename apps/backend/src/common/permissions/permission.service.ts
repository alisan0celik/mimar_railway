import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";

@Injectable()
export class PermissionService {
  constructor(private readonly prisma: PrismaService) {}

  async getEffectivePermissions(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        permissions: { where: { granted: true } },
        roles: {
          include: {
            role: { include: { permissions: true } },
          },
        },
      },
    });

    if (!user) return [];

    const fromDirect = user.permissions.map((p) => p.permission);
    const fromRoles = user.roles.flatMap((ur) =>
      ur.role.permissions.map((rp) => rp.permission),
    );

    return Array.from(new Set([...fromDirect, ...fromRoles]));
  }

  async syncUserPermissionsFromRoles(userId: string): Promise<void> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: { include: { permissions: true } } },
    });

    const rolePermissions = Array.from(
      new Set(
        userRoles.flatMap((ur) => ur.role.permissions.map((rp) => rp.permission)),
      ),
    );

    await this.prisma.userPermission.deleteMany({ where: { userId } });

    if (rolePermissions.length > 0) {
      await this.prisma.userPermission.createMany({
        data: rolePermissions.map((permission) => ({ userId, permission })),
      });
    }
  }

  async syncPermissionsForRoleUsers(roleId: string): Promise<void> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { roleId },
      select: { userId: true },
    });

    await Promise.all(
      userRoles.map((ur) => this.syncUserPermissionsFromRoles(ur.userId)),
    );
  }
}
