import { Body, Controller, Delete, Get, Post } from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";

import { ApiProtectedController } from "../../common/decorators/api-docs.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { JwtPayload } from "../../common/interfaces/jwt-payload.interface";
import { CompanyScopeService } from "../../common/tenant/company-scope.service";
import { RequireApproved } from "../../common/tenant/require-approved.decorator";
import { RequireCompany } from "../../common/tenant/require-company.decorator";
import { FavouriteItemDto } from "./dto/favourite-item.dto";
import { ProgressService } from "./progress.service";

/**
 * Şirketin favori imalat kalemleri.
 *
 * Projeden bağımsız bir liste: proje açılış ekranı henüz proje yokken de
 * okuyabilmeli, bu yüzden proje altında değil şirket kapsamında durur.
 */
@Controller("work-items")
@RequireCompany()
@RequireApproved()
@ApiProtectedController("Projects")
export class WorkItemsController {
  constructor(
    private readonly progressService: ProgressService,
    private readonly companyScope: CompanyScopeService,
  ) {}

  private companyId(user: JwtPayload) {
    return this.companyScope.requireCompanyId(user.companyId);
  }

  @Get()
  @Permissions("project.view")
  @ApiOperation({ summary: "Favori imalat kalemlerini listele" })
  list(@CurrentUser() user: JwtPayload) {
    return this.progressService.listFavourites(this.companyId(user));
  }

  @Post()
  @Permissions("project.update")
  @ApiOperation({ summary: "Favori imalat kalemi ekle" })
  add(@CurrentUser() user: JwtPayload, @Body() body: FavouriteItemDto) {
    return this.progressService.addFavourite(this.companyId(user), body.name);
  }

  @Delete()
  @Permissions("project.update")
  @ApiOperation({ summary: "Favori imalat kalemini çıkar" })
  remove(@CurrentUser() user: JwtPayload, @Body() body: FavouriteItemDto) {
    return this.progressService.removeFavouriteByName(this.companyId(user), body.name);
  }
}
