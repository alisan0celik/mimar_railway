import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiConsumes, ApiOperation } from "@nestjs/swagger";
import type { Response } from "express";
import { createReadStream } from "fs";
import { memoryStorage } from "multer";

import { ApiProtectedController } from "../../common/decorators/api-docs.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { JwtPayload } from "../../common/interfaces/jwt-payload.interface";
import { CompanyScopeService } from "../../common/tenant/company-scope.service";
import { RequireApproved } from "../../common/tenant/require-approved.decorator";
import { RequireCompany } from "../../common/tenant/require-company.decorator";
import { AddFieldReportPhotoDto, CreateFieldReportDto } from "./dto/create-field-report.dto";
import { MAX_PHOTO_SIZE } from "./field-report.storage";
import { FieldReportsService } from "./field-reports.service";

/**
 * Proje saha raporları. Projeyi görebilen herkes rapor yazabilir (saha
 * personeli dahil); raporu yazan kişi ya da proje düzenleme yetkisi olan
 * değiştirir ve siler.
 */
@Controller("projects/:projectId/field-reports")
@RequireCompany()
@RequireApproved()
@ApiProtectedController("Field Reports")
export class FieldReportsController {
  constructor(
    private readonly fieldReports: FieldReportsService,
    private readonly companyScope: CompanyScopeService,
  ) {}

  private companyId(user: JwtPayload) {
    return this.companyScope.requireCompanyId(user.companyId);
  }

  @Get()
  @Permissions("project.view")
  @ApiOperation({ summary: "Projenin saha raporlarını listele" })
  list(@CurrentUser() user: JwtPayload, @Param("projectId") projectId: string) {
    return this.fieldReports.list(this.companyId(user), projectId);
  }

  @Post()
  @Permissions("project.view")
  @ApiOperation({ summary: "Saha raporu oluştur (aynı clientId ile tekrar gönderim yeni kayıt açmaz)" })
  create(
    @CurrentUser() user: JwtPayload,
    @Param("projectId") projectId: string,
    @Body() dto: CreateFieldReportDto,
  ) {
    return this.fieldReports.create(this.companyId(user), projectId, user.sub, dto);
  }

  @Post(":reportId/photos")
  @Permissions("project.view")
  @UseInterceptors(
    FileInterceptor("photo", { storage: memoryStorage(), limits: { fileSize: MAX_PHOTO_SIZE } }),
  )
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Saha raporuna fotoğraf ekle" })
  addPhoto(
    @CurrentUser() user: JwtPayload,
    @Param("projectId") projectId: string,
    @Param("reportId") reportId: string,
    @Body() dto: AddFieldReportPhotoDto,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    return this.fieldReports.addPhoto(
      this.companyId(user),
      projectId,
      reportId,
      user.sub,
      dto.clientPhotoId,
      file,
    );
  }

  @Get(":reportId/photos/:photoId")
  @Permissions("project.view")
  @ApiOperation({ summary: "Saha raporu fotoğrafını getir" })
  async photo(
    @CurrentUser() user: JwtPayload,
    @Param("projectId") projectId: string,
    @Param("reportId") reportId: string,
    @Param("photoId") photoId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const photo = await this.fieldReports.getPhoto(this.companyId(user), projectId, reportId, photoId);
    res.set({
      "Content-Type": photo.mimeType,
      "Content-Length": String(photo.size),
      // Fotoğraf değişmiyor; cihaz önbelleğinde tutulabilir ama paylaşılan
      // önbelleklerde (vekil sunucu) tutulmamalı.
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    });
    return new StreamableFile(createReadStream(photo.path));
  }

  @Delete(":reportId")
  @Permissions("project.view")
  @ApiOperation({ summary: "Saha raporunu ve fotoğraflarını sil" })
  remove(
    @CurrentUser() user: JwtPayload,
    @Param("projectId") projectId: string,
    @Param("reportId") reportId: string,
  ) {
    return this.fieldReports.remove(this.companyId(user), projectId, reportId, user.sub);
  }
}
