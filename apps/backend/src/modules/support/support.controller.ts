import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  ForbiddenException,
  Param,
  Query,
} from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";
import { SupportService } from "./support.service";
import { CreateSupportTicketDto } from "./dto/create-support-ticket.dto";
import { CreateTicketMessageDto } from "./dto/create-ticket-message.dto";
import { UpdateTicketStatusDto } from "./dto/update-ticket-status.dto";
import { SupportInboxQueryDto } from "./dto/support-inbox-query.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { isPlatformAdminEmail } from "../../common/subscription.util";
import { RequireCompany } from "../../common/tenant/require-company.decorator";
import { RequireApproved } from "../../common/tenant/require-approved.decorator";
import { JwtPayload } from "../../common/interfaces/jwt-payload.interface";
import { CompanyScopeService } from "../../common/tenant/company-scope.service";
import { ApiProtectedController } from "../../common/decorators/api-docs.decorator";

@Controller("support")
@RequireApproved()
@ApiProtectedController("Support")
export class SupportController {
  constructor(
    private readonly supportService: SupportService,
    private readonly companyScope: CompanyScopeService,
  ) {}

  /**
   * Gelen kutusu tüm şirketlerin taleplerini içerir; bu yüzden şirket içi bir
   * izinle (support.manage) değil, yalnızca platform yöneticisiyle korunur.
   */
  private assertPlatformAdmin(user: JwtPayload) {
    if (!isPlatformAdminEmail(user.email)) {
      throw new ForbiddenException("Bu alan sadece platform yöneticisine açıktır");
    }
  }

  @Get("inbox")
  @ApiOperation({ summary: "Platform destek gelen kutusu" })
  getInbox(@CurrentUser() user: JwtPayload, @Query() query: SupportInboxQueryDto) {
    this.assertPlatformAdmin(user);
    return this.supportService.getInbox(query);
  }

  @Get("inbox/:id")
  @ApiOperation({ summary: "Platform destek talebi detayı" })
  getInboxTicket(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    this.assertPlatformAdmin(user);
    return this.supportService.getInboxTicket(id);
  }

  @Patch("inbox/:id/status")
  @ApiOperation({ summary: "Destek talebi durumunu güncelle" })
  updateInboxStatus(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() body: UpdateTicketStatusDto,
  ) {
    this.assertPlatformAdmin(user);
    return this.supportService.updateStatus(id, body.status);
  }

  @Post("inbox/:id/reply")
  @ApiOperation({ summary: "Destek talebine platform yanıtı ekle" })
  replyInbox(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() body: CreateTicketMessageDto,
  ) {
    this.assertPlatformAdmin(user);
    return this.supportService.addStaffReply(user.sub, id, body.body);
  }

  @Get()
  @ApiOperation({ summary: "Kullanıcının destek taleplerini listele" })
  getTickets(@CurrentUser() user: JwtPayload) {
    return this.supportService.getTickets(user.sub);
  }

  @Post()
  @RequireCompany()
  @ApiOperation({ summary: "Yeni destek talebi oluştur" })
  createTicket(
    @CurrentUser() user: JwtPayload,
    @Body() body: CreateSupportTicketDto,
  ) {
    const companyId = this.companyScope.requireCompanyId(user.companyId);
    return this.supportService.createTicket(user.sub, companyId, body);
  }

  @Get(":id")
  @ApiOperation({ summary: "Destek talebi detayı" })
  getTicket(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.supportService.getTicketForUser(user.sub, id);
  }

  @Post(":id/messages")
  @ApiOperation({ summary: "Destek talebine kullanıcı mesajı ekle" })
  addMessage(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() body: CreateTicketMessageDto,
  ) {
    return this.supportService.addUserMessage(user.sub, id, body.body);
  }
}
