import {
  Controller,
  Get,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from "@nestjs/common";
import { ApiOperation, ApiQuery } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { PermissionsAny } from "../../common/decorators/permissions-any.decorator";
import { RequireCompany } from "../../common/tenant/require-company.decorator";
import { JwtPayload } from "../../common/interfaces/jwt-payload.interface";
import { PermissionService } from "../../common/permissions/permission.service";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { UpdateUserStatusDto } from "./dto/update-user-status.dto";
import { AssignRoleDto } from "./dto/assign-role.dto";
import { UpdateNotificationPreferencesDto } from "./dto/update-notification-preferences.dto";
import { ApiProtectedController } from "../../common/decorators/api-docs.decorator";

@Controller("users")
@ApiProtectedController("Users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly permissionService: PermissionService,
  ) {}

  @Get()
  @RequireCompany()
  @PermissionsAny("user.view", "user.approve")
  @ApiOperation({ summary: "Şirket kullanıcılarını listele" })
  @ApiQuery({ name: "status", required: false, description: "Onay durumuna göre filtrele" })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query() pagination: PaginationDto,
    @Query("status") status?: string,
  ) {
    const permissions = await this.permissionService.getEffectivePermissions(user.sub);
    return this.usersService.findByCompany(
      user.companyId,
      { ...pagination, status },
      permissions,
    );
  }

  @Patch("profile")
  @ApiOperation({ summary: "Kendi profil bilgilerini güncelle" })
  async updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.sub, dto);
  }

  @Patch("notification-preferences")
  @ApiOperation({ summary: "Bildirim tercihlerini güncelle" })
  async updateNotificationPrefs(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    const permissions = await this.permissionService.getEffectivePermissions(user.sub);
    return this.usersService.updateNotificationPreferences(
      user.sub,
      dto.notificationPreferences,
      permissions,
    );
  }

  @Get("team")
  @RequireCompany()
  @Permissions("user.role.assign")
  @ApiOperation({ summary: "Onaylı ofis üyelerini listele" })
  async findTeam(@CurrentUser() user: JwtPayload) {
    return this.usersService.findTeamMembers(user.companyId);
  }

  @Get(":id")
  @RequireCompany()
  @PermissionsAny("user.view", "user.approve")
  @ApiOperation({ summary: "Kullanıcı detayı" })
  async findOne(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
  ) {
    return this.usersService.findById(id, user.companyId);
  }

  @Patch(":id/status")
  @RequireCompany()
  @PermissionsAny("user.approve", "user.reject")
  @ApiOperation({ summary: "Kullanıcı onay durumunu güncelle" })
  async updateStatus(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.usersService.updateStatus(id, user.companyId, dto.status, dto.roleId);
  }

  @Patch(":id/role")
  @RequireCompany()
  @Permissions("user.role.assign")
  @ApiOperation({ summary: "Kullanıcıya rol ata (mevcut rollere ekler)" })
  async assignRole(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: AssignRoleDto,
  ) {
    return this.usersService.assignRole(id, dto.roleId, user.companyId);
  }

  @Put(":id/role")
  @RequireCompany()
  @Permissions("user.role.assign")
  @ApiOperation({
    summary: "Kullanıcı rolünü güncelle",
    description: "Mevcut rolleri değiştirir (tek rol modeli). Ofis sahibi rolü korunur.",
  })
  async replaceRole(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: AssignRoleDto,
  ) {
    return this.usersService.replaceUserRole(user.sub, id, dto.roleId, user.companyId);
  }

  @Delete(":id/membership")
  @RequireCompany()
  @Permissions("user.remove")
  @ApiOperation({
    summary: "Kullanıcıyı ofisten çıkar",
    description: "Onaylı üyeyi ofisten çıkarır, oturumunu sonlandırır ve proje ekiplerinden kaldırır.",
  })
  async removeMembership(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
  ) {
    return this.usersService.removeFromCompany(user.sub, id, user.companyId);
  }
}
