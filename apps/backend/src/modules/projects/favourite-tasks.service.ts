import { BadRequestException, Injectable } from "@nestjs/common";

import { PrismaService } from "../../common/prisma.service";
import { normaliseName } from "./normalise-name";

/** Prisma'nın benzersizlik ihlali kodu. */
const UNIQUE_VIOLATION = "P2002";

/**
 * Şirketin favori yapılacakları.
 *
 * Her projede yeniden girilen işler (ruhsat dosyası, zemin etüdü, müşteriye
 * sunum...) bir kez yıldızlanır; yeni açılan her projeye otomatik eklenir.
 * Liste projeden bağımsız, şirket kapsamında durur.
 *
 * Ekleme ve çıkarma başlık üzerinden çalışır ki ekrandaki yıldız tek
 * dokunuşla dönebilsin. Karşılaştırma Türkçe kurallarıyla yapılır: "İş" ile
 * "iş" aynı favori sayılır.
 */
@Injectable()
export class FavouriteTasksService {
  constructor(private readonly prisma: PrismaService) {}

  list(companyId: string) {
    return this.prisma.companyFavouriteTask.findMany({
      where: { companyId },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
  }

  /** Başlığı favorilere ekler; zaten varsa mevcut kaydı döndürür. */
  async add(companyId: string, title: string) {
    const trimmed = title.trim();
    if (trimmed.length < 2) {
      throw new BadRequestException("Yapılacak başlığı en az 2 karakter olmalı");
    }

    const favourites = await this.list(companyId);
    const existing = this.findByTitle(favourites, trimmed);
    if (existing) return existing;

    const nextOrder = favourites.reduce((max, item) => Math.max(max, item.order), 0) + 1;

    try {
      return await this.prisma.companyFavouriteTask.create({
        data: { companyId, title: trimmed, order: nextOrder },
      });
    } catch (error) {
      // İki cihaz aynı anda yıldızladıysa ikincisi benzersizlik ihlaline
      // düşer; hata vermek yerine öbürünün oluşturduğu kaydı döndür.
      if ((error as { code?: string } | null)?.code === UNIQUE_VIOLATION) {
        const winner = this.findByTitle(await this.list(companyId), trimmed);
        if (winner) return winner;
      }
      throw error;
    }
  }

  async removeByTitle(companyId: string, title: string) {
    const matches = (await this.list(companyId)).filter(
      (item) => normaliseName(item.title) === normaliseName(title),
    );

    if (matches.length > 0) {
      await this.prisma.companyFavouriteTask.deleteMany({
        where: { companyId, id: { in: matches.map((item) => item.id) } },
      });
    }
    return { success: true };
  }

  private findByTitle<T extends { title: string }>(items: T[], title: string): T | undefined {
    const key = normaliseName(title);
    return items.find((item) => normaliseName(item.title) === key);
  }
}
