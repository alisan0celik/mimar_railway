import { Injectable } from "@nestjs/common";
import { NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { resolveEventWindow } from "./calendar-event.utils";
import { NotificationsService } from "../notifications/notifications.service";
import {
  CALENDAR_EVENT_ACTION,
  NOTIFICATION_TARGET,
  calendarRoute,
} from "../notifications/notification-events.constants";
import {
  calendarEventCreatedNotification,
  resolveNotificationLocale,
} from "../notifications/notification-templates";

@Injectable()
export class CalendarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getEventsForCompany(companyId: string, year: number, month: number) {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);

    const events = await this.prisma.calendarEvent.findMany({
      where: {
        companyId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: "asc" },
    });

    return events.map((e) => this.toResponse(e));
  }

  /**
   * Yanıtta her zaman gerçek başlangıç/bitiş anı bulunur.
   *
   * Eski kayıtlarda bu alanlar boş olabildiği için `date` + `time` ikilisinden
   * türetilir; böylece cihaz takvimine yazan istemci hep bir zaman aralığı görür.
   */
  private toResponse(event: {
    date: Date;
    time: string;
    startsAt: Date | null;
    endsAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    const { startsAt, endsAt } = resolveEventWindow(event);
    return {
      ...event,
      date: event.date.toISOString(),
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    };
  }

  async createEvent(
    userId: string,
    companyId: string,
    dto: {
      title: string;
      projectName?: string;
      time: string;
      type?: string;
      date: string;
      startsAt?: string;
      endsAt?: string;
    },
  ) {
    const window = resolveEventWindow({
      date: new Date(dto.date),
      time: dto.time,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
      endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
    });

    const event = await this.prisma.calendarEvent.create({
      data: {
        userId,
        companyId,
        title: dto.title,
        projectName: dto.projectName || "Takvim",
        time: dto.time,
        type: dto.type ?? "meeting",
        date: new Date(dto.date),
        startsAt: window.startsAt,
        endsAt: window.endsAt,
      },
    });

    await this.notifyCompanyOnEventCreated(companyId, userId, event.id, event.title, event.time);

    return this.toResponse(event);
  }

  /** Etkinlik güncelleme. Şirket dışından bir kayda erişilemez. */
  async updateEvent(
    companyId: string,
    eventId: string,
    dto: {
      title?: string;
      projectName?: string;
      time?: string;
      type?: string;
      date?: string;
      startsAt?: string;
      endsAt?: string;
    },
  ) {
    const existing = await this.prisma.calendarEvent.findFirst({
      where: { id: eventId, companyId },
    });
    if (!existing) throw new NotFoundException("Etkinlik bulunamadı");

    const date = dto.date ? new Date(dto.date) : existing.date;
    const window = resolveEventWindow({
      date,
      time: dto.time ?? existing.time,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
      endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
    });

    const event = await this.prisma.calendarEvent.update({
      where: { id: eventId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.projectName !== undefined ? { projectName: dto.projectName } : {}),
        ...(dto.time !== undefined ? { time: dto.time } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        date,
        startsAt: window.startsAt,
        endsAt: window.endsAt,
      },
    });

    return this.toResponse(event);
  }

  async removeEvent(companyId: string, eventId: string) {
    const result = await this.prisma.calendarEvent.deleteMany({
      where: { id: eventId, companyId },
    });
    if (result.count === 0) throw new NotFoundException("Etkinlik bulunamadı");
    return { success: true };
  }

  private async notifyCompanyOnEventCreated(
    companyId: string,
    creatorId: string,
    eventId: string,
    eventTitle: string,
    time: string,
  ) {
    const creator = await this.prisma.user.findUnique({
      where: { id: creatorId },
      select: { fullName: true },
    });
    if (!creator) return;

    const locale = resolveNotificationLocale(null);
    const copy = calendarEventCreatedNotification(locale, {
      creatorName: creator.fullName,
      eventTitle,
      time,
    });

    const users = await this.prisma.user.findMany({
      where: {
        companyId,
        approvalStatus: "approved",
        id: { not: creatorId },
      },
      select: { id: true, notificationPreferences: true },
    });
    if (users.length === 0) return;

    await Promise.all(
      users.map((user) => {
        const prefs = user.notificationPreferences as Record<string, boolean> | null;
        if (prefs?.system === false) return Promise.resolve();

        return this.notificationsService.createForUser({
          userId: user.id,
          title: copy.title,
          message: copy.message,
          type: "info",
          targetType: NOTIFICATION_TARGET.CALENDAR_EVENT,
          targetId: eventId,
          action: CALENDAR_EVENT_ACTION.CREATED,
          route: calendarRoute(),
          metadata: { eventId },
        });
      }),
    );
  }
}
