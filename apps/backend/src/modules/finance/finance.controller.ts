import { Controller, Get, Post, Body, Patch, Param, Delete } from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";
import { FinanceService } from "./finance.service";
import { CreateFinanceRecordDto } from "./dto/create-finance-record.dto";
import { UpdateFinanceRecordDto } from "./dto/update-finance-record.dto";
import { UpdateBudgetDto } from "./dto/update-budget.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { RequireCompany } from "../../common/tenant/require-company.decorator";
import { RequireApproved } from "../../common/tenant/require-approved.decorator";
import { JwtPayload } from "../../common/interfaces/jwt-payload.interface";
import { CompanyScopeService } from "../../common/tenant/company-scope.service";
import { ApiProtectedController } from "../../common/decorators/api-docs.decorator";

@Controller("finance")
@RequireCompany()
@RequireApproved()
@ApiProtectedController("Finance")
export class FinanceController {
  constructor(
    private readonly financeService: FinanceService,
    private readonly companyScope: CompanyScopeService,
  ) {}

  private companyId(user: JwtPayload) {
    return this.companyScope.requireCompanyId(user.companyId);
  }

  @Post()
  @Permissions("finance.payment.create")
  @ApiOperation({ summary: "Finans kaydı oluştur" })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateFinanceRecordDto) {
    return this.financeService.create(this.companyId(user), user.sub, dto);
  }

  @Get("summary")
  @Permissions("finance.view")
  @ApiOperation({ summary: "Finans özetini getir" })
  getSummaries(@CurrentUser() user: JwtPayload) {
    return this.financeService.getSummaries(this.companyId(user));
  }

  @Get()
  @Permissions("finance.view")
  @ApiOperation({ summary: "Finans kayıtlarını listele" })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.financeService.findAll(this.companyId(user));
  }

  @Get("project/:projectId")
  @Permissions("finance.view")
  @ApiOperation({ summary: "Projeye ait finans kayıtlarını listele" })
  findByProject(@CurrentUser() user: JwtPayload, @Param("projectId") projectId: string) {
    return this.financeService.findByProject(this.companyId(user), projectId);
  }

  @Patch("project/:projectId/budget")
  @Permissions("finance.update")
  @ApiOperation({ summary: "Proje bütçesini güncelle" })
  updateProjectBudget(@CurrentUser() user: JwtPayload, @Param("projectId") projectId: string, @Body() body: UpdateBudgetDto) {
    return this.financeService.updateProjectBudget(this.companyId(user), projectId, body.budget);
  }

  @Get("audit/anomalies")
  @Permissions("finance.update")
  @ApiOperation({ summary: "Anormal tutarlı finans kayıtlarını listele" })
  auditAnomalies(@CurrentUser() user: JwtPayload) {
    return this.financeService.auditAnomalousRecords(this.companyId(user));
  }

  @Patch(":id")
  @Permissions("finance.update")
  @ApiOperation({ summary: "Finans kaydını güncelle" })
  update(@CurrentUser() user: JwtPayload, @Param("id") id: string, @Body() dto: UpdateFinanceRecordDto) {
    return this.financeService.update(this.companyId(user), id, dto);
  }

  @Delete(":id")
  @Permissions("finance.update")
  @ApiOperation({ summary: "Finans kaydını sil" })
  remove(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.financeService.remove(this.companyId(user), id);
  }
}
