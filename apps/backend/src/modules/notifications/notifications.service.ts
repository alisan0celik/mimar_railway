import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { NotificationsGateway } from "./notifications.gateway";
import { FcmService } from "./fcm.service";
import { FCM_CHANNEL_MEMBERSHIP, FCM_CHANNEL_PROJECT, FCM_CHANNEL_SUPPORT } from "./notification-events.constants";

type NotificationType = "info" | "success" | "warning" | "danger";
type DeviceTokenRow = { token: string };

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
    private readonly fcmService: FcmService,
  ) {}

  async createForUser(input: {
    userId: string;
    title: string;
    message: string;
    type?: NotificationType;
    targetType: string;
    targetId?: string;
    action?: string;
    route?: string;
    metadata?: Record<string, string>;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        title: input.title,
        message: input.message,
        type: input.type ?? "info",
        targetType: input.targetType,
        targetId: input.targetId,
      },
    });

    const payload = {
      ...notification,
      createdAt: notification.createdAt.toISOString(),
      action: input.action,
      route: input.route,
    };

    this.gateway.sendNotification(input.userId, payload);

    const unreadCount = await this.prisma.notification.count({
      where: { userId: input.userId, isRead: false },
    });
    this.gateway.sendUnreadCount(input.userId, unreadCount);

    const deviceTokens = await this.prisma.deviceToken.findMany({
      where: { userId: input.userId },
    });

    if (deviceTokens.length > 0) {
      const pushData: Record<string, string> = {
        id: notification.id,
        type: notification.type,
        targetType: input.targetType,
        targetId: input.targetId ?? "",
        title: input.title,
        message: input.message,
      };

      if (input.action) pushData.action = input.action;
      if (input.route) pushData.route = input.route;
      if (input.metadata) {
        Object.assign(pushData, input.metadata);
      }

      const channelId =
        input.targetType === "membership"
          ? FCM_CHANNEL_MEMBERSHIP
          : input.targetType === "project_task" || input.targetType === "project_note"
            ? FCM_CHANNEL_PROJECT
            : input.targetType === "support_ticket"
              ? FCM_CHANNEL_SUPPORT
              : undefined;

      const { invalidTokens } = await this.fcmService.sendToMultipleDevices(
        deviceTokens.map((d: DeviceTokenRow) => d.token),
        {
          title: input.title,
          body: input.message,
          data: pushData,
          channelId,
        },
      );

      if (invalidTokens.length > 0) {
        await this.prisma.deviceToken.deleteMany({
          where: { token: { in: invalidTokens } },
        });
      }
    }

    return payload;
  }
}
