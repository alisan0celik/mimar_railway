import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";
import { RolesService } from "./roles.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { RequireCompany } from "../../common/tenant/require-company.decorator";
import { RequireApproved } from "../../common/tenant/require-approved.decorator";
import { JwtPayload } from "../../common/interfaces/jwt-payload.interface";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { CompanyScopeService } from "../../common/tenant/company-scope.service";
import { ApiProtectedController } from "../../common/decorators/api-docs.decorator";

@Controller("roles")
@RequireCompany()
@RequireApproved()
@ApiProtectedController("Roles")
export class RolesController {
  constructor(
    private readonly rolesService: RolesService,
    private readonly companyScope: CompanyScopeService,
  ) {}

  @Get()
  @Permissions("role.view")
  @ApiOperation({ summary: "Şirket rollerini listele" })
  async findAll(@CurrentUser() user: JwtPayload) {
    const companyId = this.companyScope.requireCompanyId(user.companyId);
    return this.rolesService.findAll(companyId);
  }

  @Get(":id")
  @Permissions("role.view")
  @ApiOperation({ summary: "Rol detayı" })
  async findOne(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
  ) {
    const companyId = this.companyScope.requireCompanyId(user.companyId);
    return this.rolesService.findById(id, companyId);
  }

  @Post()
  @Permissions("role.create")
  @ApiOperation({ summary: "Yeni rol oluştur" })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateRoleDto,
  ) {
    const companyId = this.companyScope.requireCompanyId(user.companyId);
    return this.rolesService.create(companyId, dto);
  }

  @Patch(":id")
  @Permissions("role.update")
  @ApiOperation({ summary: "Rolü güncelle" })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    const companyId = this.companyScope.requireCompanyId(user.companyId);
    return this.rolesService.update(id, companyId, dto);
  }

  @Delete(":id")
  @Permissions("role.update")
  @ApiOperation({ summary: "Rolü sil" })
  async remove(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
  ) {
    const companyId = this.companyScope.requireCompanyId(user.companyId);
    return this.rolesService.remove(id, companyId);
  }

  @Post(":roleId/assign/:userId")
  @Permissions("user.role.assign")
  @ApiOperation({ summary: "Kullanıcıya rol ata" })
  async assignRole(
    @CurrentUser() user: JwtPayload,
    @Param("roleId") roleId: string,
    @Param("userId") userId: string,
  ) {
    const companyId = this.companyScope.requireCompanyId(user.companyId);
    return this.rolesService.assignRole(userId, roleId, companyId);
  }

  @Delete(":roleId/assign/:userId")
  @Permissions("user.role.assign")
  @ApiOperation({ summary: "Kullanıcıdan rol kaldır" })
  async removeRole(
    @CurrentUser() user: JwtPayload,
    @Param("roleId") roleId: string,
    @Param("userId") userId: string,
  ) {
    const companyId = this.companyScope.requireCompanyId(user.companyId);
    return this.rolesService.removeRole(userId, roleId, companyId);
  }
}
