import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PermissionService } from "../../common/permissions/permission.service";
import { PrismaService } from "../../common/prisma.service";
import { CreateFieldReportDto } from "./dto/create-field-report.dto";
import { photoPath, removeDir, removeFile, reportDir, savePhoto } from "./field-report.storage";

/** Bir rapora eklenebilecek en fazla fotoğraf. */
export const MAX_PHOTOS_PER_REPORT = 10;

const REPORT_INCLUDE = {
  author: { select: { id: true, fullName: true, avatarUrl: true } },
  photos: {
    select: { id: true, clientPhotoId: true, mimeType: true, size: true, createdAt: true },
    orderBy: { createdAt: "asc" as const },
  },
};

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

/**
 * Saha raporları: sahada yazılan not, konum ve fotoğraflar.
 *
 * Saha personeli internet yokken de rapor yazabiliyor; uygulama raporu ve her
 * fotoğrafı kendi ürettiği kimlikle sonradan gönderiyor. Bağlantı yarıda
 * kopup gönderim tekrarlanırsa aynı rapor ya da fotoğraf ikinci kez
 * oluşturulmuyor, var olan döndürülüyor.
 */
@Injectable()
export class FieldReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: PermissionService,
  ) {}

  private async assertProject(companyId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, companyId },
      select: { id: true },
    });
    if (!project) throw new NotFoundException("Proje bulunamadı");
  }

  private async findReport(companyId: string, projectId: string, reportId: string) {
    const report = await this.prisma.fieldReport.findFirst({
      where: { id: reportId, projectId, companyId },
      include: { photos: true },
    });
    if (!report) throw new NotFoundException("Saha raporu bulunamadı");
    return report;
  }

  /** Raporu yazan kişi ya da proje düzenleme yetkisi olan değiştirebilir. */
  private async assertCanChange(report: { authorId: string }, userId: string) {
    if (report.authorId === userId) return;
    const permissions = await this.permissions.getEffectivePermissions(userId);
    if (!permissions.includes("project.update")) {
      throw new ForbiddenException(
        "Bu raporu yalnızca yazan kişi ya da proje düzenleme yetkisi olanlar değiştirebilir",
      );
    }
  }

  async list(companyId: string, projectId: string) {
    await this.assertProject(companyId, projectId);
    return this.prisma.fieldReport.findMany({
      where: { projectId, companyId },
      include: REPORT_INCLUDE,
      orderBy: { observedAt: "desc" },
    });
  }

  async create(companyId: string, projectId: string, userId: string, dto: CreateFieldReportDto) {
    await this.assertProject(companyId, projectId);

    const existing = await this.findByClientId(companyId, dto.clientId);
    if (existing) return this.sameReportOrConflict(existing, projectId, userId);

    try {
      return await this.prisma.fieldReport.create({
        data: {
          clientId: dto.clientId,
          title: dto.title?.trim() || null,
          note: dto.note.trim(),
          latitude: dto.latitude ?? null,
          longitude: dto.longitude ?? null,
          observedAt: new Date(dto.observedAt),
          projectId,
          companyId,
          authorId: userId,
        },
        include: REPORT_INCLUDE,
      });
    } catch (error) {
      // İki istek aynı anda geldiyse ikincisi ilkinin kaydını döndürür.
      if (!isUniqueViolation(error)) throw error;
      const raced = await this.findByClientId(companyId, dto.clientId);
      if (!raced) throw error;
      return this.sameReportOrConflict(raced, projectId, userId);
    }
  }

  private findByClientId(companyId: string, clientId: string) {
    return this.prisma.fieldReport.findUnique({
      where: { companyId_clientId: { companyId, clientId } },
      include: REPORT_INCLUDE,
    });
  }

  private sameReportOrConflict<T extends { projectId: string; authorId: string }>(
    report: T,
    projectId: string,
    userId: string,
  ): T {
    if (report.projectId !== projectId || report.authorId !== userId) {
      throw new ConflictException("Bu rapor kimliği başka bir rapora ait");
    }
    return report;
  }

  async addPhoto(
    companyId: string,
    projectId: string,
    reportId: string,
    userId: string,
    clientPhotoId: string,
    file: { buffer: Buffer; size: number } | undefined,
  ) {
    const report = await this.findReport(companyId, projectId, reportId);
    await this.assertCanChange(report, userId);

    const already = report.photos.find((photo) => photo.clientPhotoId === clientPhotoId);
    if (already) return already;

    if (report.photos.length >= MAX_PHOTOS_PER_REPORT) {
      throw new BadRequestException(`Bir rapora en fazla ${MAX_PHOTOS_PER_REPORT} fotoğraf eklenebilir`);
    }

    const dir = reportDir(companyId, projectId, reportId);
    const saved = await savePhoto(dir, file);

    try {
      return await this.prisma.fieldReportPhoto.create({
        data: { reportId, clientPhotoId, ...saved },
      });
    } catch (error) {
      // Kayıt yazılamadıysa diskteki dosya sahipsiz kalmasın.
      await removeFile(photoPath(dir, saved.fileName));
      if (!isUniqueViolation(error)) throw error;
      const raced = await this.prisma.fieldReportPhoto.findUnique({
        where: { reportId_clientPhotoId: { reportId, clientPhotoId } },
      });
      if (!raced) throw error;
      return raced;
    }
  }

  async getPhoto(companyId: string, projectId: string, reportId: string, photoId: string) {
    const report = await this.findReport(companyId, projectId, reportId);
    const photo = report.photos.find((item) => item.id === photoId);
    if (!photo) throw new NotFoundException("Fotoğraf bulunamadı");

    return {
      path: photoPath(reportDir(companyId, projectId, reportId), photo.fileName),
      mimeType: photo.mimeType,
      size: photo.size,
    };
  }

  async remove(companyId: string, projectId: string, reportId: string, userId: string) {
    const report = await this.findReport(companyId, projectId, reportId);
    await this.assertCanChange(report, userId);

    await this.prisma.fieldReport.delete({ where: { id: report.id } });
    // Kayıt silindikten sonra dosyalar kaldırılır; sıra tersine olursa silme
    // hatasında rapor fotoğrafsız kalırdı.
    await removeDir(reportDir(companyId, projectId, reportId));
    return { success: true };
  }
}
