import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
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

    return events.map((e) => ({
      ...e,
      date: e.date.toISOString(),
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    }));
  }

  async createEvent(
    userId: string,
    companyId: string,
    dto: { title: string; projectName?: string; time: string; type?: string; date: string },
  ) {
    const event = await this.prisma.calendarEvent.create({
      data: {
        userId,
        companyId,
        title: dto.title,
        projectName: dto.projectName || "Takvim",
        time: dto.time,
        type: dto.type ?? "meeting",
        date: new Date(dto.date),
      },
    });

    await this.notifyCompanyOnEventCreated(companyId, userId, event.id, event.title, event.time);

    return {
      ...event,
      date: event.date.toISOString(),
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    };
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
