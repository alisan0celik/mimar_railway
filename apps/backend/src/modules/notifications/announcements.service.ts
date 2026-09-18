import { BadRequestException, ConflictException, Injectable, Logger } from "@nestjs/common";

import { PrismaService } from "../../common/prisma.service";
import { NOTIFICATION_TARGET } from "./notification-events.constants";
import { NotificationsService } from "./notifications.service";

/** Aynı anda kaç kullanıcıya bildirim hazırlanacağı; FCM'i ve veritabanını boğmamak için. */
const DELIVERY_CONCURRENCY = 10;

/** Aynı duyurunun tekrar gönderilmesini engelleyen süre. */
const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;

/** Bildirime dokunulunca açılan ekran; duyurunun tam metni orada okunur. */
const ANNOUNCEMENT_ROUTE = "/(main)/dashboard/notifications";

export type AnnouncementContent = { title: string; message: string };

/**
 * Platform yöneticisinin bütün kullanıcılara duyurusu: planlı bakım,
 * sunucu kesintisi gibi.
 *
 * Duyuru her kullanıcı için normal bildirim yolundan geçer; böylece herkes
 * hem push alır hem de uygulamadaki bildirim listesinde görür, push izni
 * kapalı olanlar dahil. Kullanıcının kategori tercihlerine (proje, finans...)
 * bakılmaz: bu bir hizmet bildirimi, cihazın push izni yine geçerli.
 */
@Injectable()
export class AnnouncementsService {
  private readonly logger = new Logger(AnnouncementsService.name);

  /**
   * Son gönderilen duyuru. İki yönetici aynı duyuruyu aynı anda ya da bir
   * yönetici düğmeye iki kez basarsa herkes iki bildirim almasın. Sunucu
   * yeniden başlarsa sıfırlanır; tek bir sunucu olduğu için bu yeterli.
   */
  private lastBroadcast: { signature: string; at: number } | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /** Onay ekranı için: kaç kişiye gidecek, kaçı push alabilecek. */
  async audience() {
    const [recipients, reachableByPush] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { deviceTokens: { some: {} } } }),
    ]);
    return { recipients, reachableByPush };
  }

  /**
   * Duyuruyu herkese gönderir.
   *
   * Alıcı sayısı hemen döner, gönderim arka planda sürer: kullanıcı sayısı
   * arttıkça hepsini beklemek istemcinin zaman aşımını geçerdi.
   */
  async broadcast(senderId: string, content: AnnouncementContent) {
    const title = content.title.trim();
    const message = content.message.trim();
    if (title.length < 3 || message.length < 5) {
      throw new BadRequestException("Başlık ve mesaj boş bırakılamaz");
    }

    const signature = `${title}\n${message}`;
    const now = Date.now();
    if (
      this.lastBroadcast &&
      this.lastBroadcast.signature === signature &&
      now - this.lastBroadcast.at < DUPLICATE_WINDOW_MS
    ) {
      throw new ConflictException("Bu duyuru birkaç dakika önce gönderildi");
    }
    // Kilit, alıcılar okunmadan kuruluyor ki eşzamanlı ikinci istek geçemesin.
    const previous = this.lastBroadcast;
    this.lastBroadcast = { signature, at: now };

    let userIds: string[];
    try {
      const users = await this.prisma.user.findMany({ select: { id: true } });
      userIds = users.map((user) => user.id);
    } catch (error) {
      // Duyuru hiç çıkmadı; kilit kalırsa 10 dakika yeniden denenemezdi.
      this.lastBroadcast = previous;
      throw error;
    }

    void this.deliver(userIds, { title, message }).then(
      ({ delivered, failed }) =>
        this.logger.log(
          `Duyuru "${title}" gönderildi: ${delivered}/${userIds.length} (gönderen ${senderId})` +
            (failed > 0 ? `, ${failed} başarısız` : ""),
        ),
      (error: unknown) =>
        this.logger.error(`Duyuru "${title}" gönderilemedi: ${String(error)}`),
    );

    return { recipients: userIds.length };
  }

  /**
   * Duyuruyu verilen kullanıcılara iletir. Bir kullanıcıda hata olması
   * (geçersiz token, anlık bir veritabanı hatası) diğerlerini durdurmaz.
   */
  async deliver(userIds: string[], content: AnnouncementContent) {
    let failed = 0;

    for (let index = 0; index < userIds.length; index += DELIVERY_CONCURRENCY) {
      const batch = userIds.slice(index, index + DELIVERY_CONCURRENCY);
      const results = await Promise.allSettled(
        batch.map((userId) =>
          this.notificationsService.createForUser({
            userId,
            title: content.title,
            message: content.message,
            type: "warning",
            targetType: NOTIFICATION_TARGET.ANNOUNCEMENT,
            route: ANNOUNCEMENT_ROUTE,
          }),
        ),
      );
      failed += results.filter((result) => result.status === "rejected").length;
    }

    return { delivered: userIds.length - failed, failed };
  }
}
