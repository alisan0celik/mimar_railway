import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../common/prisma.service";
import { NotificationsService } from "./notifications.service";
import {
  NOTIFICATION_TARGET,
  SUBSCRIPTION_ACTION,
  subscriptionRoute,
} from "./notification-events.constants";
import {
  resolveNotificationLocale,
  subscriptionExpiringNotification,
} from "./notification-templates";
import { OFFICE_ROLE_CODE_PREFIX } from "../companies/company-role.constants";

/** Bitişe kaç gün kalınca hatırlatma başlar */
const REMINDER_WINDOW_DAYS = 3;
/** Kontrol sıklığı — günde bir gönderim, tekrarı veritabanı kontrolü engelliyor */
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
/** Uygulama açılışında ilk kontrol için bekleme */
const FIRST_RUN_DELAY_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_CONTACT_EMAIL = "iletisim@kozmozinovasyon.com";

/**
 * Lisans süresi dolmak üzere olan şirketlerin sahibine, son 3 gün boyunca
 * günde bir kez yenileme hatırlatması gönderir.
 */
@Injectable()
export class SubscriptionReminderService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SubscriptionReminderService.name);
  private firstRunTimer?: NodeJS.Timeout;
  private intervalTimer?: NodeJS.Timeout;
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    this.firstRunTimer = setTimeout(() => void this.runSafely(), FIRST_RUN_DELAY_MS);
    this.intervalTimer = setInterval(() => void this.runSafely(), CHECK_INTERVAL_MS);
  }

  onModuleDestroy() {
    if (this.firstRunTimer) clearTimeout(this.firstRunTimer);
    if (this.intervalTimer) clearInterval(this.intervalTimer);
  }

  private async runSafely() {
    try {
      await this.notifyExpiringSubscriptions();
    } catch (error: any) {
      this.logger.error(`Subscription reminder failed: ${error?.message ?? error}`);
    }
  }

  async notifyExpiringSubscriptions() {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      const now = new Date();
      const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_DAYS * DAY_MS);

      const companies = await this.prisma.company.findMany({
        where: {
          status: "active",
          subscriptionStatus: { in: ["active", "trial"] },
          subscriptionEndsAt: { gt: now, lte: windowEnd },
        },
        select: { id: true, name: true, ownerId: true, subscriptionEndsAt: true },
      });

      if (companies.length === 0) return;

      // Aynı gün içinde ikinci bildirimi engellemek için günün başlangıcı
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);

      const contactEmail =
        this.configService.get<string>("SUPPORT_CONTACT_EMAIL")?.trim() || DEFAULT_CONTACT_EMAIL;
      const locale = resolveNotificationLocale(null);

      for (const company of companies) {
        if (!company.subscriptionEndsAt) continue;

        const daysLeft = Math.max(
          1,
          Math.ceil((company.subscriptionEndsAt.getTime() - now.getTime()) / DAY_MS),
        );

        const copy = subscriptionExpiringNotification(locale, {
          companyName: company.name,
          daysLeft,
          contactEmail,
        });

        const recipientIds = await this.getRecipients(company.id, company.ownerId);
        let sentCount = 0;

        for (const userId of recipientIds) {
          const alreadySentToday = await this.prisma.notification.findFirst({
            where: {
              userId,
              targetType: NOTIFICATION_TARGET.SUBSCRIPTION,
              targetId: company.id,
              createdAt: { gte: startOfDay },
            },
            select: { id: true },
          });
          if (alreadySentToday) continue;

          await this.notificationsService.createForUser({
            userId,
            title: copy.title,
            message: copy.message,
            type: "warning",
            targetType: NOTIFICATION_TARGET.SUBSCRIPTION,
            targetId: company.id,
            action: SUBSCRIPTION_ACTION.EXPIRING,
            route: subscriptionRoute(),
            metadata: { companyId: company.id, daysLeft: String(daysLeft) },
          });
          sentCount += 1;
        }

        if (sentCount > 0) {
          this.logger.log(
            `Lisans hatırlatması gönderildi: ${company.name} (${daysLeft} gün, ${sentCount} kişi)`,
          );
        }
      }
    } finally {
      this.isRunning = false;
    }
  }

  /** Ofis sahibi + ofis yöneticisi rolündeki onaylı üyeler (tekrarsız) */
  private async getRecipients(companyId: string, ownerId: string): Promise<string[]> {
    const managers = await this.prisma.user.findMany({
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
    });

    return Array.from(new Set([ownerId, ...managers.map((manager) => manager.id)]));
  }
}
