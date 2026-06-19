import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { CreateFinanceRecordDto } from "./dto/create-finance-record.dto";
import { UpdateFinanceRecordDto } from "./dto/update-finance-record.dto";
import {
  calculateGlobalFinanceSummary,
  calculateProjectFinanceSummary,
} from "./finance-summary.utils";
import { mapFinanceRecordForResponse, normalizeFinanceRecordType } from "./finance-type.utils";

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

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
