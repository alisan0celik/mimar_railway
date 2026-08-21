import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../../common/prisma.service";
import { OFFICE_ROLE_CODE_PREFIX } from "../companies/company-role.constants";
import {
  NOTIFICATION_TARGET,
  PROGRESS_PAYMENT_ACTION,
  progressPaymentRoute,
} from "../notifications/notification-events.constants";
import {
  progressPaymentIssuedNotification,
  progressPaymentPaidNotification,
  resolveNotificationLocale,
} from "../notifications/notification-templates";
import { NotificationsService } from "../notifications/notifications.service";
import { CreateProgressPaymentDto } from "./dto/create-progress-payment.dto";
import { CreateSectionDto } from "./dto/create-section.dto";
import { UpdateProgressPaymentDto } from "./dto/update-progress-payment.dto";
import { UpdateSectionDto } from "./dto/update-section.dto";
import {
  calculateEarnedAmount,
  calculateOverallProgress,
  calculateProgressSummary,
  clampProgress,
  roundCurrency,
  type ProgressSummary,
} from "./progress-payment.utils";

const PAYMENT_STATUSES = ["draft", "approved", "paid", "cancelled"] as const;
type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** Tahsilat sayılan finans kayıt türü — gider tarafı hakedişi ilgilendirmez. */
const COLLECTION_TYPE = "collection";

/**
 * Kalem adlarını karşılaştırmak için normalleştirir.
 *
 * Düz `toLowerCase()` Türkçe'de yanlış sonuç veriyor: "İ" harfi "i" yerine
 * birleşik noktalı "i̇" üretiyor ve "Kaba İnşaat" ile "kaba inşaat" farklı
 * görünüyor. Bu yüzden Türkçe yerel ayarıyla küçültülür.
 */
/**
 * Hakediş etiketi: "Mimari 1 No'lu Hakediş".
 * Kalem sonradan silinmişse ad olmadan yazılır.
 */
export function paymentLabel(sectionName: string | null | undefined, number: number): string {
  const suffix = `${number} No'lu Hakediş`;
  return sectionName ? `${sectionName} ${suffix}` : suffix;
}

/** Bildirim metni için tutar; sunucuda Intl her zaman mevcut değil diye sade tutuldu. */
function formatAmount(value: number): string {
  return `${value.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ₺`;
}

function normaliseName(value: string): string {
  return value.trim().toLocaleLowerCase("tr").normalize("NFC");
}

@Injectable()
export class ProgressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Hakediş bildirimlerini şirket sahibi ve ofis yöneticilerine gönderir.
   *
   * Hakediş tutarları finans bilgisidir; sahadaki çalışana gitmemeli. Alıcılar
   * lisans hatırlatıcısıyla aynı mantıkla bulunur: sahip + ofis yöneticisi
   * rolündeki onaylı kullanıcılar. Bildirim hatası hakedişi engellemez.
   */
  private async notifyManagers(
    companyId: string,
    projectId: string,
    payment: { id: string; number: number; amount: number; section?: { name: string } | null },
    kind: "issued" | "paid",
  ) {
    try {
      const [company, project, managers] = await Promise.all([
        this.prisma.company.findUnique({ where: { id: companyId }, select: { ownerId: true } }),
        this.prisma.project.findUnique({ where: { id: projectId }, select: { name: true } }),
        this.prisma.user.findMany({
          where: {
            companyId,
            approvalStatus: "approved",
            roles: {
              some: {
                role: {
                  companyId,
                  code: { startsWith: OFFICE_ROLE_CODE_PREFIX["office-manager"] },
                },
              },
            },
          },
          select: { id: true },
        }),
      ]);

      const recipients = Array.from(
        new Set([...(company?.ownerId ? [company.ownerId] : []), ...managers.map((m) => m.id)]),
      );
      if (recipients.length === 0 || !project) return;

      const locale = resolveNotificationLocale(null);
      const params = {
        label: paymentLabel(payment.section?.name, payment.number),
        projectName: project.name,
        amount: formatAmount(payment.amount),
      };
      const copy =
        kind === "issued"
          ? progressPaymentIssuedNotification(locale, params)
          : progressPaymentPaidNotification(locale, params);

      await Promise.all(
        recipients.map((userId) =>
          this.notificationsService.createForUser({
            userId,
            title: copy.title,
            message: copy.message,
            type: "info",
            targetType: NOTIFICATION_TARGET.PROGRESS_PAYMENT,
            targetId: payment.id,
            action:
              kind === "issued" ? PROGRESS_PAYMENT_ACTION.ISSUED : PROGRESS_PAYMENT_ACTION.PAID,
            route: progressPaymentRoute(projectId),
            metadata: { projectId },
          }),
        ),
      );
    } catch {
      // Bildirim gönderilemezse hakediş yine de düzenlenmiş sayılır
    }
  }

  private async assertProject(companyId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, companyId },
      select: { id: true, name: true, budget: true },
    });
    if (!project) throw new NotFoundException("Proje bulunamadı");
    return project;
  }

  private sectionsOf(projectId: string) {
    return this.prisma.section.findMany({
      where: { projectId },
      orderBy: { order: "asc" },
    });
  }

  /**
   * Kalem ilerlemelerinden proje geneli yüzdeyi yeniden hesaplayıp
   * Project.sectionProgress alanına yazar; proje listesi bu alanı okuyor.
   */
  private async refreshProjectProgress(projectId: string) {
    const sections = await this.sectionsOf(projectId);
    await this.prisma.project.update({
      where: { id: projectId },
      data: { sectionProgress: calculateOverallProgress(sections) },
    });
  }

  // --- İMALAT KALEMLERİ ---

  async listSections(companyId: string, projectId: string) {
    await this.assertProject(companyId, projectId);
    return this.sectionsOf(projectId);
  }

  async createSection(companyId: string, projectId: string, dto: CreateSectionDto, userId: string) {
    await this.assertProject(companyId, projectId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true },
    });

    const last = await this.prisma.section.findFirst({
      where: { projectId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const section = await this.prisma.section.create({
      data: {
        projectId,
        name: dto.name,
        order: dto.order ?? (last?.order ?? 0) + 1,
        amount: roundCurrency(dto.amount ?? 0),
        progress: clampProgress(dto.progress ?? 0),
        status: dto.status ?? "not-started",
        updatedBy: user?.fullName ?? "Sistem",
      },
    });

    await this.refreshProjectProgress(projectId);
    return section;
  }

  async updateSection(
    companyId: string,
    projectId: string,
    sectionId: string,
    dto: UpdateSectionDto,
    userId: string,
  ) {
    await this.assertProject(companyId, projectId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true },
    });

    const result = await this.prisma.section.updateMany({
      where: { id: sectionId, projectId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.order !== undefined ? { order: dto.order } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.content !== undefined ? { content: dto.content } : {}),
        ...(dto.amount !== undefined ? { amount: roundCurrency(dto.amount) } : {}),
        ...(dto.progress !== undefined ? { progress: clampProgress(dto.progress) } : {}),
        updatedBy: user?.fullName ?? "Sistem",
      },
    });

    if (result.count === 0) throw new NotFoundException("İmalat kalemi bulunamadı");

    await this.refreshProjectProgress(projectId);
    return this.prisma.section.findFirst({ where: { id: sectionId, projectId } });
  }

  async removeSection(companyId: string, projectId: string, sectionId: string) {
    await this.assertProject(companyId, projectId);

    const result = await this.prisma.section.deleteMany({ where: { id: sectionId, projectId } });
    if (result.count === 0) throw new NotFoundException("İmalat kalemi bulunamadı");

    await this.refreshProjectProgress(projectId);
    return { success: true };
  }

  // --- ŞİRKET FAVORİ KALEMLERİ ---

  /**
   * Şirketin favori imalat kalemleri.
   *
   * Her ofis/müteahhit kendi imalat listesini kurar; yeni açılan projelere
   * bu liste uygulanır. Favori yoksa proje boş açılır.
   */
  listFavourites(companyId: string) {
    return this.prisma.companyWorkItem.findMany({
      where: { companyId },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
  }

  /** Kalem adını favorilere ekler; zaten varsa mevcut kaydı döndürür. */
  async addFavourite(companyId: string, name: string) {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      throw new BadRequestException("Kalem adı en az 2 karakter olmalı");
    }

    const existing = await this.prisma.companyWorkItem.findFirst({
      where: { companyId, name: { equals: trimmed, mode: "insensitive" } },
    });
    if (existing) return existing;

    const last = await this.prisma.companyWorkItem.findFirst({
      where: { companyId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    return this.prisma.companyWorkItem.create({
      data: { companyId, name: trimmed, order: (last?.order ?? 0) + 1 },
    });
  }

  /** Favoriden çıkarır. Ad üzerinden çalışır ki ekrandaki yıldız tek dokunuşla dönebilsin. */
  async removeFavouriteByName(companyId: string, name: string) {
    await this.prisma.companyWorkItem.deleteMany({
      where: { companyId, name: { equals: name.trim(), mode: "insensitive" } },
    });
    return { success: true };
  }

  /**
   * Favori kalemleri mevcut bir projeye uygular.
   *
   * Projede aynı adla kalem varsa atlanır; böylece tekrar tekrar basmak
   * kopya kalem üretmez.
   */
  async applyFavourites(companyId: string, projectId: string, userId: string) {
    await this.assertProject(companyId, projectId);

    const [favourites, existing, user] = await Promise.all([
      this.listFavourites(companyId),
      this.sectionsOf(projectId),
      this.prisma.user.findUnique({ where: { id: userId }, select: { fullName: true } }),
    ]);

    const taken = new Set(existing.map((section) => normaliseName(section.name)));
    const missing = favourites.filter((item) => !taken.has(normaliseName(item.name)));

    if (missing.length === 0) return this.sectionsOf(projectId);

    let order = existing.reduce((max, section) => Math.max(max, section.order), 0);

    await this.prisma.section.createMany({
      data: missing.map((item) => ({
        projectId,
        name: item.name,
        order: ++order,
        status: "not-started",
        updatedBy: user?.fullName ?? "Sistem",
      })),
    });

    await this.refreshProjectProgress(projectId);
    return this.sectionsOf(projectId);
  }

  // --- HAKEDİŞ ---

  private async collectedAmount(projectId: string): Promise<number> {
    const result = await this.prisma.financeRecord.aggregate({
      where: { projectId, type: COLLECTION_TYPE },
      _sum: { amount: true },
    });
    return result._sum.amount ?? 0;
  }

  async getSummary(companyId: string, projectId: string): Promise<ProgressSummary> {
    await this.assertProject(companyId, projectId);

    const [sections, payments, collected] = await Promise.all([
      this.sectionsOf(projectId),
      this.prisma.progressPayment.findMany({
        where: { projectId },
        select: { amount: true, status: true },
      }),
      this.collectedAmount(projectId),
    ]);

    return calculateProgressSummary({
      items: sections,
      payments,
      collectedAmount: collected,
    });
  }

  async listPayments(companyId: string, projectId: string) {
    await this.assertProject(companyId, projectId);
    return this.prisma.progressPayment.findMany({
      where: { projectId },
      orderBy: [{ createdAt: "desc" }],
      include: {
        createdBy: { select: { id: true, fullName: true } },
        section: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Belirli bir imalat kalemi için hakediş düzenler.
   *
   * Tutar istemciden alınmaz: kalemin o anki hak edişinden (bedel × ilerleme)
   * aynı kalem için daha önce düzenlenmiş, iptal edilmemiş hakedişler düşülür.
   * Numaralandırma kalem içinde yürür — "Mimari 1", "Mimari 2" — böylece
   * finans kaydı hangi imalatın hangi hakedişi olduğunu taşır.
   */
  async createPayment(
    companyId: string,
    projectId: string,
    dto: CreateProgressPaymentDto,
    userId: string,
  ) {
    await this.assertProject(companyId, projectId);

    const section = await this.prisma.section.findFirst({
      where: { id: dto.sectionId, projectId },
    });
    if (!section) throw new NotFoundException("İmalat kalemi bulunamadı");

    const payments = await this.prisma.progressPayment.findMany({
      where: { projectId, sectionId: section.id },
      select: { amount: true, status: true, number: true },
    });

    const cumulativeAmount = calculateEarnedAmount([section]);
    const previousAmount = payments
      .filter((payment) => payment.status !== "cancelled")
      .reduce((sum, payment) => sum + payment.amount, 0);
    const amount = roundCurrency(cumulativeAmount - previousAmount);

    if (amount <= 0) {
      throw new BadRequestException(
        `${section.name} kaleminde önceki hakedişlerden bu yana yeni hak ediş oluşmadı`,
      );
    }

    const nextNumber = payments.reduce((max, payment) => Math.max(max, payment.number), 0) + 1;

    const created = await this.prisma.progressPayment.create({
      data: {
        projectId,
        sectionId: section.id,
        companyId,
        number: nextNumber,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : new Date(),
        cumulativeAmount,
        previousAmount: roundCurrency(previousAmount),
        amount,
        progressPercent: clampProgress(section.progress),
        status: "draft",
        note: dto.note,
        createdById: userId,
      },
      include: {
        createdBy: { select: { id: true, fullName: true } },
        section: { select: { id: true, name: true } },
      },
    });

    await this.notifyManagers(companyId, projectId, created, "issued");
    return created;
  }

  /**
   * Hakediş "ödendi" işaretlendiğinde finans tarafına tahsilat kaydı yazar,
   * durum geri alındığında o kaydı siler.
   *
   * Hakediş bir alacak belgesidir, para değildir; bu yüzden düzenlenirken
   * finansa hiçbir şey yazılmaz. Ancak tahsil edildiği an gerçek bir nakit
   * hareketi doğar. Kullanıcının aynı tutarı bir de finans ekranından elle
   * girmesini beklemek iki listenin ayrışmasına yol açıyordu.
   */
  private async syncFinanceRecord(
    payment: {
      id: string;
      number: number;
      amount: number;
      status: string;
      financeRecordId: string | null;
      projectId: string;
      companyId: string;
      createdById: string;
      issueDate: Date;
    },
    nextStatus: string,
    sectionName: string | null,
  ): Promise<string | null> {
    const wasPaid = payment.status === "paid";
    const willBePaid = nextStatus === "paid";

    if (wasPaid === willBePaid) return payment.financeRecordId;

    if (willBePaid) {
      const record = await this.prisma.financeRecord.create({
        data: {
          type: COLLECTION_TYPE,
          amount: payment.amount,
          description: paymentLabel(sectionName, payment.number),
          category: "progress-payment",
          date: payment.issueDate,
          projectId: payment.projectId,
          companyId: payment.companyId,
          createdById: payment.createdById,
        },
        select: { id: true },
      });
      return record.id;
    }

    if (payment.financeRecordId) {
      // Kullanıcı finans ekranından silmiş olabilir; yoksa sessizce geç.
      await this.prisma.financeRecord.deleteMany({ where: { id: payment.financeRecordId } });
    }
    return null;
  }

  async updatePayment(
    companyId: string,
    projectId: string,
    paymentId: string,
    dto: UpdateProgressPaymentDto,
  ) {
    await this.assertProject(companyId, projectId);

    if (dto.status && !PAYMENT_STATUSES.includes(dto.status as PaymentStatus)) {
      throw new BadRequestException("Geçersiz hakediş durumu");
    }

    const payment = await this.prisma.progressPayment.findFirst({
      where: { id: paymentId, projectId },
      include: { section: { select: { name: true } } },
    });
    if (!payment) throw new NotFoundException("Hakediş bulunamadı");

    const financeRecordId =
      dto.status !== undefined
        ? await this.syncFinanceRecord(payment, dto.status, payment.section?.name ?? null)
        : payment.financeRecordId;

    await this.prisma.progressPayment.update({
      where: { id: paymentId },
      data: {
        ...(dto.status !== undefined ? { status: dto.status, financeRecordId } : {}),
        ...(dto.note !== undefined ? { note: dto.note } : {}),
        ...(dto.issueDate !== undefined ? { issueDate: new Date(dto.issueDate) } : {}),
      },
    });

    const updated = await this.prisma.progressPayment.findFirst({
      where: { id: paymentId, projectId },
      include: {
        createdBy: { select: { id: true, fullName: true } },
        section: { select: { id: true, name: true } },
      },
    });

    if (dto.status === "paid" && payment.status !== "paid" && updated) {
      await this.notifyManagers(companyId, projectId, updated, "paid");
    }

    return updated;
  }

  /**
   * Hakedişi siler.
   *
   * Yalnızca projenin son hakedişi silinebilir: aradan biri silinirse
   * sonraki hakedişlerin "önceki toplam" değerleri tutarsız kalır.
   */
  async removePayment(companyId: string, projectId: string, paymentId: string) {
    await this.assertProject(companyId, projectId);

    const payment = await this.prisma.progressPayment.findFirst({
      where: { id: paymentId, projectId },
      select: { id: true, number: true, financeRecordId: true },
    });
    if (!payment) throw new NotFoundException("Hakediş bulunamadı");

    const last = await this.prisma.progressPayment.findFirst({
      where: { projectId },
      orderBy: { number: "desc" },
      select: { number: true },
    });

    if (last && last.number !== payment.number) {
      throw new BadRequestException(
        "Yalnızca son hakediş silinebilir. Aradaki bir hakedişi iptal etmek için durumunu 'iptal' yapın",
      );
    }

    // Ödendi işaretliyken silinirse tahsilat kaydı ortada kalmasın.
    if (payment.financeRecordId) {
      await this.prisma.financeRecord.deleteMany({ where: { id: payment.financeRecordId } });
    }

    await this.prisma.progressPayment.delete({ where: { id: payment.id } });
    return { success: true };
  }
}
