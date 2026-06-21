import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Logger, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { Server, Socket } from "socket.io";
import { getJwtAccessSecret } from "../../config/jwt.config";
import { PrismaService } from "../../common/prisma.service";

@WebSocketGateway({
  namespace: "/notifications",
  cors: { origin: true, credentials: true },
  transports: ["websocket", "polling"],
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private connectedUsers = new Map<string, string>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string | undefined) ||
        (client.handshake.headers.authorization?.replace("Bearer ", ""));

      if (!token) {
        throw new UnauthorizedException("Token gerekli");
      }

      const payload = this.jwtService.verify<{ sub: string }>(token, {
        secret: getJwtAccessSecret(this.configService),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true },
      });

      if (!user) {
        throw new UnauthorizedException("Kullanıcı bulunamadı");
      }

      this.connectedUsers.set(user.id, client.id);
      client.data.userId = user.id;
      this.logger.log(`User ${user.id} connected via WebSocket`);
    } catch (error) {
      this.logger.warn(`WebSocket auth failed: ${(error as Error).message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId as string | undefined;
    if (userId) {
      this.connectedUsers.delete(userId);
      this.logger.log(`User ${userId} disconnected`);
    }
  }

  sendNotification(userId: string, notification: Record<string, unknown>) {
    const clientId = this.connectedUsers.get(userId);
    if (clientId) {
      this.server.to(clientId).emit("notification", notification);
    }
  }

  sendUnreadCount(userId: string, count: number) {
    const clientId = this.connectedUsers.get(userId);
    if (clientId) {
      this.server.to(clientId).emit("unread_count", { count });
    }
  }

  @SubscribeMessage("mark_read")
  async handleMarkRead(client: Socket, notificationId: string) {
    const userId = client.data.userId as string | undefined;
    if (!userId || !notificationId) return;

    await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });

    const unreadCount = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });

    this.sendUnreadCount(userId, unreadCount);
    this.server.to(client.id).emit("notification_read", { notificationId });
  }
}
