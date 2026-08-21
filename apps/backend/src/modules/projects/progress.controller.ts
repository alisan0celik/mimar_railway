import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";

import { ApiProtectedController } from "../../common/decorators/api-docs.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { JwtPayload } from "../../common/interfaces/jwt-payload.interface";
import { PermissionService } from "../../common/permissions/permission.service";
import { CompanyScopeService } from "../../common/tenant/company-scope.service";
import { RequireApproved } from "../../common/tenant/require-approved.decorator";
import { RequireCompany } from "../../common/tenant/require-company.decorator";
import { CreateProgressPaymentDto } from "./dto/create-progress-payment.dto";
import { CreateSectionDto } from "./dto/create-section.dto";
import { UpdateProgressPaymentDto } from "./dto/update-progress-payment.dto";
import { UpdateSectionDto } from "./dto/update-section.dto";
import { ProgressService } from "./progress.service";

/**
 * İmalat kalemleri ve hakediş uçları.
 *
 * Sahadaki ilerlemeyi proje yetkisi olan herkes görüp güncelleyebilir; sözleşme
 * bedelleri ve hakediş tutarları ise finans yetkisi ister. Bu yüzden kalem
 * listesi finans yetkisi olmayan kullanıcıya tutar alanı olmadan döner.
 */
@Controller("projects")
@RequireCompany()
@RequireApproved()
@ApiProtectedController("Projects")
export class ProgressController {
  constructor(
    private readonly progressService: ProgressService,
    private readonly companyScope: CompanyScopeService,
    private readonly permissionService: PermissionService,
  ) {}

  private companyId(user: JwtPayload) {
    return this.companyScope.requireCompanyId(user.companyId);
  }

  private async canSeeAmounts(user: JwtPayload): Promise<boolean> {
    const permissions = await this.permissionService.getEffectivePermissions(user.sub);
    return permissions.includes("finance.view");
  }

  @Get(":id/sections")
  @Permissions("project.view")
  @ApiOperation({ summary: "İmalat kalemlerini listele" })
  async listSections(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    const sections = await this.progressService.listSections(this.companyId(user), id);
    if (await this.canSeeAmounts(user)) return sections;
    return sections.map(({ amount: _amount, ...rest }) => rest);
  }

  @Post(":id/sections")
  @Permissions("project.update")
  @ApiOperation({ summary: "İmalat kalemi ekle" })
  createSection(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() body: CreateSectionDto,
  ) {
    return this.progressService.createSection(this.companyId(user), id, body, user.sub);
  }

  @Patch(":id/sections/:sectionId")
  @Permissions("project.update")
  @ApiOperation({ summary: "İmalat kalemini güncelle" })
  updateSection(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Param("sectionId") sectionId: string,
    @Body() body: UpdateSectionDto,
  ) {
    return this.progressService.updateSection(this.companyId(user), id, sectionId, body, user.sub);
  }

  @Delete(":id/sections/:sectionId")
  @Permissions("project.update")
  @ApiOperation({ summary: "İmalat kalemini sil" })
  removeSection(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Param("sectionId") sectionId: string,
  ) {
    return this.progressService.removeSection(this.companyId(user), id, sectionId);
  }

  @Post(":id/sections/from-favourites")
  @Permissions("project.update")
  @ApiOperation({ summary: "Favori kalemleri bu projeye uygula" })
  applyFavourites(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.progressService.applyFavourites(this.companyId(user), id, user.sub);
  }

  @Get(":id/progress-summary")
  @Permissions("finance.view")
  @ApiOperation({ summary: "Hakediş özeti" })
  getSummary(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.progressService.getSummary(this.companyId(user), id);
  }

  @Get(":id/progress-payments")
  @Permissions("finance.view")
  @ApiOperation({ summary: "Hakedişleri listele" })
  listPayments(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.progressService.listPayments(this.companyId(user), id);
  }

  @Post(":id/progress-payments")
  @Permissions("finance.update")
  @ApiOperation({ summary: "Yeni hakediş düzenle" })
  createPayment(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() body: CreateProgressPaymentDto,
  ) {
    return this.progressService.createPayment(this.companyId(user), id, body, user.sub);
  }

  @Patch(":id/progress-payments/:paymentId")
  @Permissions("finance.update")
  @ApiOperation({ summary: "Hakediş durumunu güncelle" })
  updatePayment(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Param("paymentId") paymentId: string,
    @Body() body: UpdateProgressPaymentDto,
  ) {
    return this.progressService.updatePayment(this.companyId(user), id, paymentId, body);
  }

  @Delete(":id/progress-payments/:paymentId")
  @Permissions("finance.update")
  @ApiOperation({ summary: "Hakedişi sil" })
  removePayment(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Param("paymentId") paymentId: string,
  ) {
    return this.progressService.removePayment(this.companyId(user), id, paymentId);
  }
}
