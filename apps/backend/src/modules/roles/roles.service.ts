import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { CompanyScopeService } from "../../common/tenant/company-scope.service";
import { PermissionService } from "../../common/permissions/permission.service";
import { ensureDefaultOfficeRoles } from "../companies/company-default-roles.util";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly companyScope: CompanyScopeService,
    private readonly permissionService: PermissionService,
  ) {}

  async findAll(companyId: string) {
    await ensureDefaultOfficeRoles(this.prisma, companyId);

    const roles = await this.prisma.role.findMany({
      where: { companyId },
      include: {
        _count: { select: { users: true } },
        permissions: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return roles.map((r) => this.mapRole(r));
  }

  async findById(id: string, companyId: string) {
    const role = await this.prisma.role.findFirst({
      where: { id, companyId },
      include: {
        _count: { select: { users: true } },
        permissions: true,
        users: {
          include: {
            user: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!role) throw new NotFoundException("Rol bulunamadı");

    return {
      ...this.mapRole(role),
      users: role.users.map((ur) => ur.user),
    };
  }

  async create(companyId: string, dto: CreateRoleDto) {
    const existing = await this.prisma.role.findFirst({
      where: { code: dto.code, companyId },
    });

    if (existing) {
      throw new ConflictException("Bu kod ile bir rol zaten mevcut");
    }

    const role = await this.prisma.role.create({
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description,
        icon: dto.icon,
        color: dto.color,
        companyId,
        permissions: dto.permissions?.length
          ? {
              create: dto.permissions.map((p) => ({ permission: p })),
            }
          : undefined,
      },
      include: {
        permissions: true,
        _count: { select: { users: true } },
      },
    });

    return this.mapRole(role);
  }

  async update(id: string, companyId: string, dto: UpdateRoleDto) {
    const role = await this.companyScope.findRoleInCompany(id, companyId);

    const data: Record<string, unknown> = {};

    if (dto.name !== undefined) data.name = dto.name;
    if (dto.code !== undefined) data.code = dto.code;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.icon !== undefined) data.icon = dto.icon;
    if (dto.color !== undefined) data.color = dto.color;

    if (dto.code && dto.code !== role.code) {
      const existing = await this.prisma.role.findFirst({
        where: { code: dto.code, companyId },
      });
      if (existing) {
        throw new ConflictException("Bu kod ile bir rol zaten mevcut");
      }
    }

    const updated = await this.prisma.role.update({
      where: { id },
      data: {
        ...data,
        permissions: dto.permissions !== undefined
          ? {
              deleteMany: {},
              create: dto.permissions.map((p: string) => ({ permission: p })),
            }
          : undefined,
      },
      include: {
        permissions: true,
        _count: { select: { users: true } },
      },
    });

    if (dto.permissions !== undefined) {
      await this.permissionService.syncPermissionsForRoleUsers(id);
    }

    return {
      ...this.mapRole(updated),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async remove(id: string, companyId: string) {
    await this.companyScope.findRoleInCompany(id, companyId);
    await this.prisma.role.delete({ where: { id } });
    return { message: "Rol silindi" };
  }

  async assignRole(userId: string, roleId: string, companyId: string) {
    await this.companyScope.findRoleInCompany(roleId, companyId);
    await this.companyScope.findUserInCompany(userId, companyId);

    const existing = await this.prisma.userRole.findUnique({
      where: { userId_roleId: { userId, roleId } },
    });
    if (existing) {
      throw new ConflictException("Kullanıcı zaten bu role sahip");
    }

    await this.prisma.userRole.create({
      data: { userId, roleId },
    });

    await this.permissionService.syncUserPermissionsFromRoles(userId);

    return { message: "Rol atandı" };
  }

  async removeRole(userId: string, roleId: string, companyId: string) {
    await this.companyScope.findRoleInCompany(roleId, companyId);
    await this.companyScope.findUserInCompany(userId, companyId);

    const existing = await this.prisma.userRole.findUnique({
      where: { userId_roleId: { userId, roleId } },
    });
    if (!existing) throw new NotFoundException("Kullanıcı bu role sahip değil");

    await this.prisma.userRole.delete({
      where: { userId_roleId: { userId, roleId } },
    });

    await this.permissionService.syncUserPermissionsFromRoles(userId);

    return { message: "Rol kaldırıldı" };
  }

  private mapRole(role: {
    id: string;
    name: string;
    code: string;
    description: string | null;
    icon: string | null;
    color: string | null;
    companyId: string;
    _count: { users: number };
    permissions: { permission: string }[];
    createdAt: Date;
  }) {
    return {
      id: role.id,
      name: role.name,
      code: role.code,
      description: role.description,
      icon: role.icon,
      color: role.color,
      companyId: role.companyId,
      userCount: role._count.users,
      permissions: role.permissions.map((rp) => rp.permission),
      createdAt: role.createdAt.toISOString(),
    };
  }
}
