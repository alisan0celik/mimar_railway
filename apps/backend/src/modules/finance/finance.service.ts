import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import {
  FINANCE_ACTION,
  NOTIFICATION_TARGET,
  financeRoute,
} from "../notifications/notification-events.constants";
import {
  financeRecordCreatedNotification,
  resolveNotificationLocale,
} from "../notifications/notification-templates";
import { CreateFinanceRecordDto } from "./dto/create-finance-record.dto";
import { UpdateFinanceRecordDto } from "./dto/update-finance-record.dto";
import {
  calculateGlobalFinanceSummary,
  calculateProjectFinanceSummary,
} from "./finance-summary.utils";
import { mapFinanceRecordForResponse, normalizeFinanceRecordType } from "./finance-type.utils";

@Injectable()
export class FinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async buildSummariesResponse(companyId: string) {
    const projects = await this.prisma.project.findMany({
      where: { companyId },
      include: {
        financeRecords: {
          orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const projectSummaries = projects.map((project) =>
      calculateProjectFinanceSummary({
        projectId: project.id,
        projectName: project.name,
        customerName: project.customerName || "Bilinmiyor",
        budget: project.budget,
        financeRecords: project.financeRecords,
      }),
    );

    return {
      global: calculateGlobalFinanceSummary(projectSummaries),
      projects: projectSummaries,
    };
  }

  async create(companyId: string, userId: string, dto: CreateFinanceRecordDto) {
    if (dto.projectId) {
      const project = await this.prisma.project.findFirst({
        where: { id: dto.projectId, companyId },
      });
      if (!project) throw new NotFoundException("Proje bulunamadı");
    }

    const record = await this.prisma.financeRecord.create({
      data: {
        type: normalizeFinanceRecordType(dto.type),
        amount: dto.amount,
        description: dto.description,
        category: dto.category,
        paidBy: dto.paidBy,
        date: dto.date ? new Date(dto.date) : new Date(),
        projectId: dto.projectId,
        companyId,
        createdById: userId,
      },
    });

    await this.notifyManagersOnFinanceCreated(companyId, userId, record);

    const summary = await this.buildSummariesResponse(companyId);

    return {
      record: mapFinanceRecordForResponse({
        id: record.id,
        type: record.type,
        amount: record.amount,
        date: record.date.toISOString().split("T")[0],
        description: record.description || "",
        paidBy: record.paidBy || record.category || "",
        projectId: record.projectId || undefined,
      }),
      summary,
    };
  }

  private async notifyManagersOnFinanceCreated(
    companyId: string,
    creatorId: string,
    record: { id: string; type: string; amount: number; projectId: string | null },
  ) {
    const creator = await this.prisma.user.findUnique({
      where: { id: creatorId },
      select: { fullName: true },
    });
    if (!creator) return;

    let projectName: string | undefined;
    if (record.projectId) {
      const project = await this.prisma.project.findUnique({
        where: { id: record.projectId },
        select: { name: true },
      });
      projectName = project?.name;
    }

    const locale = resolveNotificationLocale(null);
    const amountText = new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 0,
    }).format(record.amount);
    const copy = financeRecordCreatedNotification(locale, {
      creatorName: creator.fullName,
      amount: amountText,
      isCollection: normalizeFinanceRecordType(record.type) === "collection",
      projectName,
    });

    // Sadece finans görüntüleme izni olan kullanıcılar (yöneticiler) bildirim alır
    const managers = await this.prisma.user.findMany({
      where: {
        companyId,
        approvalStatus: "approved",
        id: { not: creatorId },
        permissions: { some: { permission: "finance.view", granted: true } },
      },
      select: { id: true, notificationPreferences: true },
    });
    if (managers.length === 0) return;

    await Promise.all(
      managers.map((user) => {
        const prefs = user.notificationPreferences as Record<string, boolean> | null;
        if (prefs?.finance === false) return Promise.resolve();

        return this.notificationsService.createForUser({
          userId: user.id,
          title: copy.title,
          message: copy.message,
          type: "info",
          targetType: NOTIFICATION_TARGET.FINANCE_RECORD,
          targetId: record.id,
          action: FINANCE_ACTION.CREATED,
          route: financeRoute(),
          metadata: { financeRecordId: record.id },
        });
      }),
    );
  }

  async findAll(companyId: string) {
    return this.prisma.financeRecord.findMany({
      where: { companyId },
      orderBy: { date: "desc" },
    });
  }

  async findByProject(companyId: string, projectId: string) {
    return this.prisma.financeRecord.findMany({
      where: { companyId, projectId },
      orderBy: { date: "desc" },
    });
  }

  async update(companyId: string, id: string, dto: UpdateFinanceRecordDto) {
    const record = await this.prisma.financeRecord.findFirst({
      where: { id, companyId },
    });

    if (!record) throw new NotFoundException("Kayıt bulunamadı");

    const updated = await this.prisma.financeRecord.update({
      where: { id },
      data: {
        ...(dto.type !== undefined ? { type: normalizeFinanceRecordType(dto.type) } : {}),
        amount: dto.amount,
        description: dto.description,
        category: dto.category,
        paidBy: dto.paidBy,
        date: dto.date ? new Date(dto.date) : undefined,
      },
    });

    const summary = await this.buildSummariesResponse(companyId);

    return {
      record: mapFinanceRecordForResponse({
        id: updated.id,
        type: updated.type,
        amount: updated.amount,
        date: updated.date.toISOString().split("T")[0],
        description: updated.description || "",
        paidBy: updated.paidBy || updated.category || "",
        projectId: updated.projectId || undefined,
      }),
      summary,
    };
  }

  async remove(companyId: string, id: string) {
    const record = await this.prisma.financeRecord.findFirst({
      where: { id, companyId },
    });

    if (!record) throw new NotFoundException("Kayıt bulunamadı");

    await this.prisma.financeRecord.delete({ where: { id } });
    const summary = await this.buildSummariesResponse(companyId);

    return {
      message: "Kayıt başarıyla silindi",
      summary,
    };
  }

  async updateProjectBudget(companyId: string, projectId: string, budget: number) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, companyId },
    });

    if (!project) throw new NotFoundException("Proje bulunamadı");

    await this.prisma.project.update({
      where: { id: projectId },
      data: { budget },
    });

    const summary = await this.buildSummariesResponse(companyId);

    return {
      message: "Proje bütçesi güncellendi",
      summary,
    };
  }

  async getSummaries(companyId: string) {
    return this.buildSummariesResponse(companyId);
  }

  async auditAnomalousRecords(companyId: string, maxAmount = 999_999_999_999) {
    const records = await this.prisma.financeRecord.findMany({
      where: {
        companyId,
        OR: [{ amount: { lt: 0 } }, { amount: { gt: maxAmount } }],
      },
      include: {
        project: { select: { id: true, name: true } },
      },
      orderBy: { amount: "desc" },
    });

    return {
      count: records.length,
      maxAllowedAmount: maxAmount,
      records: records.map((record) => ({
        id: record.id,
        projectId: record.projectId,
        projectName: record.project?.name ?? null,
        type: record.type,
        amount: record.amount,
        date: record.date.toISOString(),
        description: record.description,
      })),
    };
  }
}
