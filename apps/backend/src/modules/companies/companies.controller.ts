import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  ForbiddenException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { ApiConsumes, ApiOperation } from "@nestjs/swagger";
import { CompaniesService } from "./companies.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { CompanyScoped } from "../../common/tenant/company-scoped.decorator";
import { RequireApproved } from "../../common/tenant/require-approved.decorator";
import { JwtPayload } from "../../common/interfaces/jwt-payload.interface";
import { CreateCompanyDto } from "./dto/create-company.dto";
import { UpdateCompanyDto } from "./dto/update-company.dto";
import { UpdateCompanySubscriptionDto } from "./dto/update-company-subscription.dto";
import { JoinRequestDto } from "./dto/join-request.dto";
import { ApproveMemberDto } from "./dto/approve-member.dto";
import { ApiProtectedController } from "../../common/decorators/api-docs.decorator";
import { isPlatformAdminEmail } from "../../common/subscription.util";

@Controller("companies")
@ApiProtectedController("Companies")
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) { }

  private assertPlatformAdmin(user: JwtPayload) {
    if (!isPlatformAdminEmail(user.email)) {
      throw new ForbiddenException("Bu alan sadece platform yoneticisine aciktir");
    }
  }

  @Get()
  @ApiOperation({ summary: "Tüm şirketleri listele" })
  async findAll() {
    return this.companiesService.findAll();
  }

  @Get("platform/licenses")
  @ApiOperation({ summary: "Platform lisanslarini listele" })
  async findPlatformLicenses(@CurrentUser() user: JwtPayload) {
    this.assertPlatformAdmin(user);
    return this.companiesService.findAllForPlatformAdmin();
  }

  @Patch("platform/licenses/:id")
  @ApiOperation({ summary: "Sirket lisansini guncelle" })
  async updatePlatformLicense(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: UpdateCompanySubscriptionDto,
  ) {
    this.assertPlatformAdmin(user);
    return this.companiesService.updateSubscription(id, dto);
  }

  @Get(":id")
  @ApiOperation({ summary: "Şirket detayı" })
  async findOne(@Param("id") id: string) {
    return this.companiesService.findById(id);
  }

  @Post()
  @Permissions("company.join")
  @ApiOperation({ summary: "Yeni şirket oluştur" })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateCompanyDto,
  ) {
    return this.companiesService.create(user.sub, dto);
  }

  @Patch(":id/logo")
  @CompanyScoped("id")
  @RequireApproved()
  @Permissions("company.update")
  @UseInterceptors(
    FileInterceptor("logo", {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Şirket logosunu yükle" })
  async uploadLogo(
    @Param("id") id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.companiesService.uploadLogo(id, file);
  }

  @Patch(":id")
  @CompanyScoped("id")
  @RequireApproved()
  @Permissions("company.update")
  @ApiOperation({ summary: "Şirket bilgilerini güncelle" })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companiesService.update(id, user.companyId!, dto);
  }

  @Post(":id/join-request")
  @Permissions("company.join")
  @ApiOperation({ summary: "Şirkete katılım talebi gönder" })
  async joinRequest(
    @CurrentUser() user: JwtPayload,
    @Param("id") companyId: string,
    @Body() dto: JoinRequestDto,
  ) {
    return this.companiesService.requestJoin(companyId, user.sub, dto);
  }

  @Get(":id/join-requests")
  @CompanyScoped("id")
  @RequireApproved()
  @Permissions("user.approve")
  @ApiOperation({ summary: "Bekleyen katılım taleplerini listele" })
  async getJoinRequests(@Param("id") companyId: string) {
    return this.companiesService.getJoinRequests(companyId);
  }

  @Get(":id/assignable-roles")
  @CompanyScoped("id")
  @RequireApproved()
  @Permissions("user.approve")
  @ApiOperation({ summary: "Onay akışında atanabilir rolleri listele" })
  async getAssignableRoles(@Param("id") companyId: string) {
    return this.companiesService.getAssignableRoles(companyId);
  }

  @Patch(":id/approve/:userId")
  @CompanyScoped("id")
  @RequireApproved()
  @Permissions("user.approve")
  @ApiOperation({ summary: "Katılım talebini onayla" })
  async approveMember(
    @Param("id") companyId: string,
    @Param("userId") userId: string,
    @Body() dto: ApproveMemberDto,
  ) {
    return this.companiesService.approveMember(companyId, userId, dto.roleId);
  }

  @Patch(":id/reject/:userId")
  @CompanyScoped("id")
  @RequireApproved()
  @Permissions("user.reject")
  @ApiOperation({ summary: "Katılım talebini reddet" })
  async rejectMember(
    @Param("id") companyId: string,
    @Param("userId") userId: string,
  ) {
    return this.companiesService.rejectMember(companyId, userId);
  }
}
