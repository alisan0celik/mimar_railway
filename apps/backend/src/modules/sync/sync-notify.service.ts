import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { NotificationsGateway } from "../notifications/notifications.gateway";

/**
 * Bir üye çevrimdışı yaptığı değişiklikleri gönderdiğinde, şirketteki diğer
 * üyelerin açık uygulamalarına "verini yenile" sinyali yollar.
 *
 * Bu sinyal eskiden push bildirimiydi ve herkesin telefonunda görünür bir
 * "Proje verileri güncellendi" bildirimi çıkıyordu. Sessiz (yalnızca veri
 * içeren) push da çözmüyordu: eski Android sürümleri uygulama açıkken onu
 * başlıksız boş bir bildirim olarak gösteriyor, iOS ise ayrı bir arka plan
 * görevi ve yeni bir uygulama sürümü olmadan JS tarafına hiç iletmiyor.
 * WebSocket üzerinden giden sinyal hiçbir şey göstermiyor; uygulaması açık
 * olanlar veriyi hemen yeniliyor, kapalı olanlar açtıklarında senkronlanıyor.
 */
@Injectable()
export class SyncNotifyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
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

    for (const user of users) {
      this.gateway.sendSyncRequired(user.id, { entity, companyId });
    }
  }
}
