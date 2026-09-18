import { Body, Controller, Delete, Get, Post } from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";

import { ApiProtectedController } from "../../common/decorators/api-docs.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { JwtPayload } from "../../common/interfaces/jwt-payload.interface";
import { CompanyScopeService } from "../../common/tenant/company-scope.service";
import { RequireApproved } from "../../common/tenant/require-approved.decorator";
import { RequireCompany } from "../../common/tenant/require-company.decorator";
import { FavouriteTaskDto } from "./dto/favourite-task.dto";
import { FavouriteTasksService } from "./favourite-tasks.service";

/**
 * Şirketin favori yapılacakları.
 *
 * Yıldızlama yetkisi yapılacak ekleyip silebilenlerle aynı: listeyi
 * değiştirmek şirketteki her yeni projeyi etkilediği için okuma yetkisi
 * yetmiyor.
 */
@Controller("favourite-tasks")
@RequireCompany()
@RequireApproved()
@ApiProtectedController("Projects")
export class FavouriteTasksController {
  constructor(
    private readonly favouriteTasks: FavouriteTasksService,
    private readonly companyScope: CompanyScopeService,
  ) {}

  private companyId(user: JwtPayload) {
    return this.companyScope.requireCompanyId(user.companyId);
  }

  @Get()
  @Permissions("project.view")
  @ApiOperation({ summary: "Favori yapılacakları listele" })
  list(@CurrentUser() user: JwtPayload) {
    return this.favouriteTasks.list(this.companyId(user));
  }

  @Post()
  @Permissions("project.task.manage")
  @ApiOperation({ summary: "Yapılacağı favorilere ekle" })
  add(@CurrentUser() user: JwtPayload, @Body() body: FavouriteTaskDto) {
    return this.favouriteTasks.add(this.companyId(user), body.title);
  }

  @Delete()
  @Permissions("project.task.manage")
  @ApiOperation({ summary: "Yapılacağı favorilerden çıkar" })
  remove(@CurrentUser() user: JwtPayload, @Body() body: FavouriteTaskDto) {
    return this.favouriteTasks.removeByTitle(this.companyId(user), body.title);
  }
}
