import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtPayload } from "../../common/interfaces/jwt-payload.interface";
import { RequireCompany } from "../../common/tenant/require-company.decorator";
import { RequireApproved } from "../../common/tenant/require-approved.decorator";
import { CompanyScopeService } from "../../common/tenant/company-scope.service";
import { ApiProtectedController } from "../../common/decorators/api-docs.decorator";
import { SyncService } from "./sync.service";
import { PushSyncDto } from "./dto/push-sync.dto";

@Controller("sync")
@RequireCompany()
@RequireApproved()
@ApiProtectedController("Sync")
export class SyncController {
  constructor(
    private readonly syncService: SyncService,
    private readonly companyScope: CompanyScopeService,
  ) {}

  @Get("pull")
  @ApiOperation({ summary: "Değişen proje verilerini çek (delta sync)" })
  async pull(@CurrentUser() user: JwtPayload, @Query("since") since?: string) {
    const companyId = this.companyScope.requireCompanyId(user.companyId);
    return this.syncService.pull(companyId, since);
  }

  @Post("push")
  @ApiOperation({ summary: "Offline kuyruğundaki değişiklikleri gönder" })
  async push(@CurrentUser() user: JwtPayload, @Body() dto: PushSyncDto) {
    const companyId = this.companyScope.requireCompanyId(user.companyId);
    return this.syncService.push(companyId, user.sub, dto.mutations);
  }
}
