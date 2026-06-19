import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { PermissionService } from "../../common/permissions/permission.service";
import { AuthService } from "../auth/auth.service";
import { NotificationsService } from "../notifications/notifications.service";
import { CreateCompanyDto } from "./dto/create-company.dto";
import { UpdateCompanyDto } from "./dto/update-company.dto";
import { UpdateCompanySubscriptionDto } from "./dto/update-company-subscription.dto";
import { JoinRequestDto } from "./dto/join-request.dto";
import { saveCompanyLogo } from "./company-logo.storage";
import {
  MEMBERSHIP_ACTION,
  MEMBERSHIP_ROUTES,
  NOTIFICATION_TARGET,
} from "../notifications/notification-events.constants";
import {
  membershipApprovedNotification,
  membershipRejectedNotification,
  resolveNotificationLocale,
} from "../notifications/notification-templates";
import {
  ALL_PERMISSIONS,
  OFFICE_EMPLOYEE_PERMISSIONS,
} from "./company-role.constants";
import {
  DEFAULT_OFFICE_EMPLOYEE_META,
  DEFAULT_OFFICE_MANAGER_META,
  ensureDefaultOfficeRoles,
  isOwnerRoleCode,
} from "./company-default-roles.util";

@Injectable()
export class CompaniesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionService: PermissionService,
    private readonly authService: AuthService,
    private readonly notificationsService: NotificationsService,
  ) { }

  async findAll() {
    const companies = await this.prisma.company.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        city: true,
        status: true,
        logoInitials: true,
        createdAt: true,
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return companies.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      city: c.city,
      status: c.status,
      logoInitials: c.logoInitials,
      memberCount: c._count.members,
      createdAt: c.createdAt.toISOString(),
    }));
  }

  private mapPlatformCompany(company: any) {
    const now = Date.now();
    const createdAt = company.createdAt.getTime();
    const usedDays = Math.max(0, Math.floor((now - createdAt) / (1000 * 60 * 60 * 24)));
    const daysRemaining = company.subscriptionEndsAt
      ? Math.ceil((company.subscriptionEndsAt.getTime() - now) / (1000 * 60 * 60 * 24))
      : null;

    return {
      id: company.id,
      name: company.name,
      city: company.city,
      status: company.status,
      subscriptionStatus: company.subscriptionStatus,
      subscriptionStartedAt: company.subscriptionStartedAt.toISOString(),
      subscriptionEndsAt: company.subscriptionEndsAt?.toISOString() ?? null,
      blockedReason: company.blockedReason,
      lastActivityAt: company.lastActivityAt?.toISOString() ?? null,
      createdAt: company.createdAt.toISOString(),
      usedDays,
      usedMonths: Math.floor(usedDays / 30),
      daysRemaining,
      memberCount: company._count.members,
      projectCount: company._count.projects,
      owner: company.owner
        ? {
            id: company.owner.id,
            fullName: company.owner.fullName,
            email: company.owner.email,
          }
        : null,
    };
  }

  async findAllForPlatformAdmin() {
    const companies = await this.prisma.company.findMany({
      select: {
        id: true,
        name: true,
        city: true,
        status: true,
        subscriptionStatus: true,
        subscriptionStartedAt: true,
        subscriptionEndsAt: true,
        blockedReason: true,
        lastActivityAt: true,
        createdAt: true,
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        _count: { select: { members: true, projects: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return companies.map((company) => this.mapPlatformCompany(company));
  }

  async updateSubscription(companyId: string, dto: UpdateCompanySubscriptionDto) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException("Sirket bulunamadi");

    const updated = await this.prisma.company.update({
      where: { id: companyId },
      data: {
        status:
          dto.subscriptionStatus && dto.subscriptionStatus !== "blocked"
            ? "active"
            : undefined,
        subscriptionStatus: dto.subscriptionStatus,
        subscriptionEndsAt:
          dto.subscriptionEndsAt === undefined
            ? undefined
            : dto.subscriptionEndsAt
              ? new Date(dto.subscriptionEndsAt)
              : null,
        blockedReason:
          dto.blockedReason === undefined
            ? undefined
            : dto.blockedReason?.trim() || null,
      },
      select: {
        id: true,
        name: true,
        city: true,
        status: true,
        subscriptionStatus: true,
        subscriptionStartedAt: true,
        subscriptionEndsAt: true,
        blockedReason: true,
        lastActivityAt: true,
        createdAt: true,
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        _count: { select: { members: true, projects: true } },
      },
    });

    return this.mapPlatformCompany(updated);
  }

  async findById(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        city: true,
        address: true,
        phone: true,
        logoUrl: true,
        logoInitials: true,
        status: true,
        createdAt: true,
      },
    });

    if (!company) throw new NotFoundException("Şirket bulunamadı");

    return {
      id: company.id,
      name: company.name,
      description: company.description,
      city: company.city,
      address: company.address,
      phone: company.phone,
      logoUrl: company.logoUrl,
      logoInitials: company.logoInitials,
      status: company.status,
      createdAt: company.createdAt.toISOString(),
    };
  }

  private readonly ALL_PERMISSIONS = [...ALL_PERMISSIONS];

  async create(ownerId: string, dto: CreateCompanyDto) {
    const existing = await this.prisma.user.findUnique({
      where: { id: ownerId },
      include: { company: true },
    });

    if (existing?.companyId) {
      throw new ConflictException("Zaten bir şirkete üyesiniz");
    }

    const logoInitials = dto.name
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const employeePermissions = OFFICE_EMPLOYEE_PERMISSIONS;
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    const company = await this.prisma.$transaction(async (tx) => {
      const createdCompany = await tx.company.create({
        data: {
          name: dto.name,
          description: dto.description,
          city: dto.city,
          address: dto.address,
          phone: dto.phone,
          logoInitials,
          ownerId,
          subscriptionStatus: "trial",
          subscriptionEndsAt: trialEndsAt,
          members: { connect: { id: ownerId } },
        },
      });

      await tx.user.update({
        where: { id: ownerId },
        data: {
          companyId: createdCompany.id,
          approvalStatus: "approved",
        },
      });

      const ownerRole = await tx.role.create({
        data: {
          name: "Sahip",
          code: `owner-${createdCompany.id.slice(-6)}`,
          description: "Şirket sahibi, tüm yetkilere sahiptir",
          icon: "crown-outline",
          color: "#7C3AED",
          companyId: createdCompany.id,
          permissions: {
            create: this.ALL_PERMISSIONS.map((p) => ({ permission: p })),
          },
        },
      });

      await tx.userRole.create({
        data: { userId: ownerId, roleId: ownerRole.id },
      });

      await tx.role.create({
        data: {
          name: DEFAULT_OFFICE_MANAGER_META.name,
          code: `office-manager-${createdCompany.id.slice(-6)}`,
          description: DEFAULT_OFFICE_MANAGER_META.description,
          icon: DEFAULT_OFFICE_MANAGER_META.icon,
          color: DEFAULT_OFFICE_MANAGER_META.color,
          companyId: createdCompany.id,
          permissions: {
            create: this.ALL_PERMISSIONS.map((p) => ({ permission: p })),
          },
        },
      });

      await tx.role.create({
        data: {
          name: DEFAULT_OFFICE_EMPLOYEE_META.name,
          code: `office-employee-${createdCompany.id.slice(-6)}`,
          description: DEFAULT_OFFICE_EMPLOYEE_META.description,
          icon: DEFAULT_OFFICE_EMPLOYEE_META.icon,
          color: DEFAULT_OFFICE_EMPLOYEE_META.color,
          companyId: createdCompany.id,
          permissions: {
            create: employeePermissions.map((p) => ({ permission: p })),
          },
        },
      });

      return createdCompany;
    });

    await this.permissionService.syncUserPermissionsFromRoles(ownerId);

    const freshTokens = await this.authService.refreshTokensForUser(ownerId);

    return {
      id: company.id,
      name: company.name,
      createdAt: company.createdAt.toISOString(),
      ...freshTokens,
    };
  }

  async uploadLogo(companyId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("Logo dosyası gerekli");
    }

    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException("Şirket bulunamadı");

    const logoUrl = await saveCompanyLogo(companyId, file);

    const updated = await this.prisma.company.update({
      where: { id: companyId },
      data: { logoUrl },
    });

    return {
      id: updated.id,
      logoUrl: updated.logoUrl,
    };
  }

  async update(id: string, companyId: string, dto: UpdateCompanyDto) {
    if (id !== companyId) {
      throw new ForbiddenException("Bu şirket kaynağına erişim yetkiniz yok");
    }

    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException("Şirket bulunamadı");

    const updated = await this.prisma.company.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        city: dto.city,
        address: dto.address,
        phone: dto.phone,
      },
    });

    return updated;
  }

  async requestJoin(companyId: string, userId: string, dto: JoinRequestDto) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) throw new NotFoundException("Şirket bulunamadı");
    if (company.status !== "active") {
      throw new ForbiddenException("Bu şirket şu anda aktif değil");
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.companyId) {
      throw new ConflictException("Zaten bir şirkete üyesiniz");
    }

    const existingRequest = await this.prisma.user.findFirst({
      where: {
        id: userId,
        companyId: null,
        approvalStatus: "pending",
      },
    });

    if (existingRequest) {
      throw new ConflictException("Zaten bekleyen bir katılım talebiniz var");
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        companyId,
        approvalStatus: "pending",
        title: dto.message || null,
      },
    });

    const requester = await this.prisma.user.findUnique({ where: { id: userId } });

    await this.notificationsService.createForUser({
      userId: company.ownerId,
      title: "Yeni katılım talebi",
      message: `${requester?.fullName ?? "Bir kullanıcı"} ${company.name} şirketine katılmak istiyor.`,
      type: "info",
      targetType: "join_request",
      targetId: userId,
    });

    const freshTokens = await this.authService.refreshTokensForUser(userId);

    return {
      message: "Katılım talebiniz gönderildi",
      ...freshTokens,
    };
  }

  async getJoinRequests(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) throw new NotFoundException("Şirket bulunamadı");

    const pendingUsers = await this.prisma.user.findMany({
      where: {
        companyId,
        approvalStatus: "pending",
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        title: true,
        createdAt: true,
      },
    });

    return pendingUsers;
  }

  async getAssignableRoles(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) throw new NotFoundException("Şirket bulunamadı");

    await ensureDefaultOfficeRoles(this.prisma, companyId);

    const roles = await this.prisma.role.findMany({
      where: { companyId },
      include: {
        _count: { select: { users: true } },
        permissions: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return roles
      .filter((role) => !isOwnerRoleCode(role.code))
      .map((role) => ({
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
        isDefault:
          role.code.startsWith("office-manager-") ||
          role.code.startsWith("office-employee-"),
      }));
  }

  async approveMember(companyId: string, userId: string, roleId: string) {
    await ensureDefaultOfficeRoles(this.prisma, companyId);
    const user = await this.prisma.user.findFirst({
      where: { id: userId, companyId, approvalStatus: "pending" },
    });

    if (!user) throw new NotFoundException("Kullanıcı bulunamadı");

    const role = await this.prisma.role.findFirst({
      where: { id: roleId, companyId },
    });

    if (!role) {
      throw new NotFoundException("Atanacak rol bulunamadı");
    }

    if (role.code.startsWith("owner-")) {
      throw new BadRequestException("Ofis sahibi rolü atanamaz");
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { approvalStatus: "approved" },
    });

    await this.prisma.userRole.deleteMany({ where: { userId } });
    await this.prisma.userRole.create({
      data: { userId, roleId: role.id },
    });

    await this.permissionService.syncUserPermissionsFromRoles(userId);

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true },
    });
    const locale = resolveNotificationLocale(null);
    const copy = membershipApprovedNotification(locale, {
      companyName: company?.name ?? "Şirket",
      roleName: role.name,
    });

    await this.notificationsService.createForUser({
      userId,
      title: copy.title,
      message: copy.message,
      type: "success",
      targetType: NOTIFICATION_TARGET.MEMBERSHIP,
      targetId: companyId,
      action: MEMBERSHIP_ACTION.APPROVED,
      route: MEMBERSHIP_ROUTES.APPROVED,
    });

    return { message: "Kullanıcı onaylandı" };
  }

  async rejectMember(companyId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, companyId },
      include: { company: { select: { name: true } } },
    });

    if (!user) throw new NotFoundException("Kullanıcı bulunamadı");

    const companyName = user.company?.name ?? "Şirket";
    const locale = resolveNotificationLocale(null);
    const copy = membershipRejectedNotification(locale, { companyName });

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        companyId: null,
        approvalStatus: "rejected",
      },
    });

    await this.notificationsService.createForUser({
      userId,
      title: copy.title,
      message: copy.message,
      type: "warning",
      targetType: NOTIFICATION_TARGET.MEMBERSHIP,
      targetId: companyId,
      action: MEMBERSHIP_ACTION.REJECTED,
      route: MEMBERSHIP_ROUTES.REJECTED,
    });

    return { message: "Kullanıcı reddedildi" };
  }
}
