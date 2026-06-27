import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { CompanyScopeService } from "../../common/tenant/company-scope.service";
import { PermissionService } from "../../common/permissions/permission.service";
import { NotificationsService } from "../notifications/notifications.service";
import { CompaniesService } from "../companies/companies.service";

// Çıkarılan kullanıcının yeniden katılım talebi gönderebilmesi için geri verilen
// temel izinler (kayıttaki DEFAULT_USER_PERMISSIONS ile aynı).
const BASELINE_USER_PERMISSIONS = ["company.join", "notification.view"];

export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly companyScope: CompanyScopeService,
    private readonly permissionService: PermissionService,
    private readonly notificationsService: NotificationsService,
    @Inject(forwardRef(() => CompaniesService))
    private readonly companiesService: CompaniesService,
  ) {}

  async findByCompany(
    companyId: string | null,
    query: { page?: number; limit?: number; status?: string },
    actorPermissions: string[] = [],
  ) {
    if (!companyId) return { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };

    if (query.status) {
      const statuses = query.status.split(",");
      const needsApprovalAccess = statuses.some(
        (value) => value === "pending" || value === "rejected",
      );
      if (needsApprovalAccess && !actorPermissions.includes("user.approve")) {
        throw new ForbiddenException("Bekleyen kullanıcı listesini görüntüleme yetkiniz yok");
      }
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { companyId };
    if (query.status) {
      const statuses = query.status.split(",");
      where.approvalStatus = statuses.length === 1 ? statuses[0] : { in: statuses };
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          roles: { include: { role: true } },
          company: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: await Promise.all(
        users.map(async (user) => ({
          ...this.mapUser(user),
          permissions: await this.permissionService.getEffectivePermissions(user.id),
        })),
      ),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, companyId: string | null) {
    const scopedCompanyId = this.companyScope.requireCompanyId(companyId);

    const user = await this.prisma.user.findFirst({
      where: { id, companyId: scopedCompanyId },
      include: {
        roles: { include: { role: true } },
        permissions: true,
        company: true,
      },
    });

    if (!user) throw new NotFoundException("Kullanıcı bulunamadı");

    const permissions = await this.permissionService.getEffectivePermissions(user.id);
    return { ...this.mapUser(user), permissions };
  }

  async updateProfile(id: string, dto: any) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("Kullanıcı bulunamadı");

    const updated = await this.prisma.user.update({
      where: { id },
      data: dto,
      include: {
        roles: { include: { role: true } },
        permissions: true,
        company: true,
      },
    });

    return this.mapUser(updated);
  }

  async updateNotificationPreferences(
    userId: string,
    notificationPreferences: Record<string, boolean>,
    actorPermissions: string[] = [],
  ) {
    if (notificationPreferences.finance === true && !actorPermissions.includes("finance.view")) {
      throw new ForbiddenException("Finans bildirimleri için yetkiniz yok");
    }

    return this.updateProfile(userId, { notificationPreferences });
  }

  async updateStatus(
    id: string,
    companyId: string | null,
    status: string,
    roleId?: string,
  ) {
    const scopedCompanyId = this.companyScope.requireCompanyId(companyId);
    await this.companyScope.findUserInCompany(id, scopedCompanyId);

    if (status === "rejected") {
      await this.prisma.user.update({
        where: { id },
        data: { companyId: null, approvalStatus: "rejected" },
      });
      return { message: "Kullanıcı reddedildi" };
    }

    if (status === "approved") {
      if (!roleId) {
        throw new BadRequestException("Onay için rol seçimi zorunludur");
      }
      return this.companiesService.approveMember(scopedCompanyId, id, roleId);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { approvalStatus: status as any },
      include: {
        roles: { include: { role: true } },
        permissions: true,
        company: true,
      },
    });

    return this.mapUser(updated);
  }

  async assignRole(userId: string, roleId: string, companyId: string | null) {
    const scopedCompanyId = this.companyScope.requireCompanyId(companyId);
    await this.companyScope.findUserInCompany(userId, scopedCompanyId);
    await this.companyScope.findRoleInCompany(roleId, scopedCompanyId);

    const existingUserRole = await this.prisma.userRole.findFirst({
      where: { userId, roleId },
    });

    if (existingUserRole) {
      throw new ConflictException("Kullanıcı zaten bu role sahip");
    }

    await this.prisma.userRole.create({
      data: { userId, roleId },
    });

    await this.permissionService.syncUserPermissionsFromRoles(userId);

    return this.findById(userId, scopedCompanyId);
  }

  async findTeamMembers(companyId: string | null) {
    const scopedCompanyId = this.companyScope.requireCompanyId(companyId);

    const users = await this.prisma.user.findMany({
      where: { companyId: scopedCompanyId, approvalStatus: "approved" },
      include: {
        roles: { include: { role: true } },
        company: true,
      },
      orderBy: { fullName: "asc" },
    });

    return Promise.all(
      users.map(async (user) => ({
        ...this.mapUser(user),
        permissions: await this.permissionService.getEffectivePermissions(user.id),
      })),
    );
  }

  async replaceUserRole(
    actorId: string,
    userId: string,
    roleId: string,
    companyId: string | null,
  ) {
    const scopedCompanyId = this.companyScope.requireCompanyId(companyId);
    const targetUser = await this.companyScope.findUserInCompany(userId, scopedCompanyId);

    if (targetUser.approvalStatus !== "approved") {
      throw new ForbiddenException("Yalnızca onaylı üyelerin rolü güncellenebilir");
    }

    const company = await this.prisma.company.findUnique({
      where: { id: scopedCompanyId },
      select: { ownerId: true, name: true },
    });

    if (!company) throw new NotFoundException("Şirket bulunamadı");

    const newRole = await this.companyScope.findRoleInCompany(roleId, scopedCompanyId);
    const actorIsOwner = company.ownerId === actorId;

    if (company.ownerId === userId && !actorIsOwner) {
      throw new ForbiddenException("Ofis sahibinin rolü değiştirilemez");
    }

    if (newRole.code.startsWith("owner-") && userId !== company.ownerId) {
      throw new ForbiddenException("Ofis sahibi rolü başkasına atanamaz");
    }

    await this.prisma.userRole.deleteMany({ where: { userId } });
    await this.prisma.userRole.create({ data: { userId, roleId } });
    await this.permissionService.syncUserPermissionsFromRoles(userId);

    await this.notificationsService.createForUser({
      userId,
      title: "Rolünüz güncellendi",
      message: `${company.name} ofisindeki rolünüz "${newRole.name}" olarak güncellendi.`,
      type: "info",
      targetType: "user_role",
      targetId: roleId,
    });

    return this.findById(userId, scopedCompanyId);
  }

  async removeFromCompany(
    actorId: string,
    userId: string,
    companyId: string | null,
  ) {
    const scopedCompanyId = this.companyScope.requireCompanyId(companyId);

    if (actorId === userId) {
      throw new ForbiddenException("Kendinizi ofisten çıkaramazsınız");
    }

    const company = await this.prisma.company.findUnique({
      where: { id: scopedCompanyId },
      select: { ownerId: true, name: true },
    });

    if (!company) throw new NotFoundException("Şirket bulunamadı");

    if (company.ownerId === userId) {
      throw new ForbiddenException("Ofis sahibi ofisten çıkarılamaz");
    }

    const targetUser = await this.companyScope.findUserInCompany(userId, scopedCompanyId);

    if (targetUser.approvalStatus !== "approved") {
      throw new ForbiddenException("Yalnızca onaylı üyeler ofisten çıkarılabilir");
    }

    const actorIsOwner = company.ownerId === actorId;
    if (!actorIsOwner) {
      const targetIsManager = await this.userHasRoleCode(userId, scopedCompanyId, "office-manager-");
      if (targetIsManager) {
        throw new ForbiddenException("Ofis yöneticisi yalnızca ofis sahibi tarafından çıkarılabilir");
      }
    }

    const projectIds = await this.prisma.project.findMany({
      where: { companyId: scopedCompanyId },
      select: { id: true },
    });

    await this.prisma.$transaction([
      this.prisma.projectTeam.deleteMany({
        where: {
          userId,
          projectId: { in: projectIds.map((p) => p.id) },
        },
      }),
      this.prisma.userRole.deleteMany({ where: { userId } }),
      this.prisma.userPermission.deleteMany({ where: { userId } }),
      // Temel izinleri geri ver ki çıkarılan kullanıcı tekrar katılım talebi gönderebilsin
      this.prisma.userPermission.createMany({
        data: BASELINE_USER_PERMISSIONS.map((permission) => ({ userId, permission })),
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          companyId: null,
          approvalStatus: "suspended",
          refreshToken: null,
        },
      }),
    ]);

    await this.notificationsService.createForUser({
      userId,
      title: "Ofis üyeliği sonlandırıldı",
      message: `${company.name} ofis üyeliğiniz sonlandırıldı.`,
      type: "warning",
      targetType: "membership",
      targetId: scopedCompanyId,
    });

    return { message: "Kullanıcı ofisten çıkarıldı" };
  }

  private async userHasRoleCode(
    userId: string,
    companyId: string,
    codePrefix: string,
  ): Promise<boolean> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });

    return userRoles.some(
      (ur) => ur.role.companyId === companyId && ur.role.code.startsWith(codePrefix),
    );
  }

  private mapUser(user: any) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      authProvider: user.authProvider,
      approvalStatus: user.approvalStatus,
      title: user.title,
      companyId: user.companyId,
      companyName: user.company?.name || null,
      roles: user.roles?.map((ur: any) => ({
        id: ur.role.id,
        name: ur.role.name,
        code: ur.role.code,
      })) || [],
      permissions: user.permissions?.map((up: any) => up.permission) || [],
      notificationPreferences: user.notificationPreferences ?? null,
      createdAt: user.createdAt?.toISOString(),
    };
  }
}
