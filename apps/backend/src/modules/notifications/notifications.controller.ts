import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  Query,
} from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";
import { PrismaService } from "../../common/prisma.service";
import { FcmService } from "./fcm.service";
import { NotificationsGateway } from "./notifications.gateway";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtPayload } from "../../common/interfaces/jwt-payload.interface";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { RegisterDeviceTokenDto, RemoveDeviceTokenDto } from "./dto/device-token.dto";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ApiProtectedController } from "../../common/decorators/api-docs.decorator";

@Controller("notifications")
@ApiProtectedController("Notifications")
export class NotificationsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fcmService: FcmService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  @Get()
  @Permissions("notification.view")
  @ApiOperation({ summary: "Bildirimleri listele" })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query() pagination: PaginationDto,
  ) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId: user.sub },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.notification.count({ where: { userId: user.sub } }),
    ]);

    const unreadCount = await this.prisma.notification.count({
      where: { userId: user.sub, isRead: false },
    });

    return {
      data: notifications.map((n) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        unreadCount,
      },
    };
  }

  @Patch(":id/read")
  @ApiOperation({ summary: "Bildirimi okundu olarak işaretle" })
  async markAsRead(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    await this.prisma.notification.updateMany({
      where: { id, userId: user.sub },
      data: { isRead: true },
    });

    const unreadCount = await this.prisma.notification.count({
      where: { userId: user.sub, isRead: false },
    });
    this.notificationsGateway.sendUnreadCount(user.sub, unreadCount);

    return { message: "Bildirim okundu olarak işaretlendi" };
  }

  @Patch("read-all")
  @ApiOperation({ summary: "Tüm bildirimleri okundu olarak işaretle" })
  async markAllAsRead(@CurrentUser() user: JwtPayload) {
    await this.prisma.notification.updateMany({
      where: { userId: user.sub, isRead: false },
      data: { isRead: true },
    });

    this.notificationsGateway.sendUnreadCount(user.sub, 0);
    return { message: "Tüm bildirimler okundu olarak işaretlendi" };
  }

  @Post("device-token")
  @ApiOperation({ summary: "Push bildirim cihaz token'ı kaydet" })
  async registerDeviceToken(
    @CurrentUser() user: JwtPayload,
    @Body() body: RegisterDeviceTokenDto,
  ) {
    const existing = await this.prisma.deviceToken.findUnique({
      where: { token: body.token },
    });

    if (existing) {
      if (existing.userId !== user.sub) {
        await this.prisma.deviceToken.update({
          where: { token: body.token },
          data: { userId: user.sub, platform: body.platform },
        });
      }
    } else {
      await this.prisma.deviceToken.create({
        data: {
          userId: user.sub,
          token: body.token,
          platform: body.platform,
        },
      });
    }

    return { message: "Cihaz kaydedildi" };
  }

  @Delete("device-token")
  @ApiOperation({ summary: "Push bildirim cihaz token'ını kaldır" })
  async removeDeviceToken(
    @CurrentUser() user: JwtPayload,
    @Body() body: RemoveDeviceTokenDto,
  ) {
    await this.prisma.deviceToken.deleteMany({
      where: { userId: user.sub, token: body.token },
    });
    return { message: "Cihaz kaydı kaldırıldı" };
  }
}
