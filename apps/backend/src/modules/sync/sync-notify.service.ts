import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { FcmService } from "../notifications/fcm.service";

@Injectable()
export class SyncNotifyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fcmService: FcmService,
  ) {}

  async notifyCompanySync(companyId: string, entity = "projects", excludeUserId?: string) {
    const users = await this.prisma.user.findMany({
      where: {
        companyId,
        approvalStatus: "approved",
        ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
      },
      select: { id: true },
    });

    if (users.length === 0) return;

    const deviceTokens = await this.prisma.deviceToken.findMany({
      where: { userId: { in: users.map((user) => user.id) } },
    });

    if (deviceTokens.length === 0) return;

    await this.fcmService.sendToMultipleDevices(
      deviceTokens.map((token) => token.token),
      {
        title: "Mimar Platform",
        body: "Proje verileri güncellendi",
        data: {
          type: "sync_required",
          entity,
          companyId,
        },
      },
    );
  }
}
