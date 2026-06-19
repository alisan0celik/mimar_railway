import { Controller, Get, Post, Patch, Body, Param, Query } from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";
import { SupportService } from "./support.service";
import { CreateSupportTicketDto } from "./dto/create-support-ticket.dto";
import { CreateTicketMessageDto } from "./dto/create-ticket-message.dto";
import { UpdateTicketStatusDto } from "./dto/update-ticket-status.dto";
import { SupportInboxQueryDto } from "./dto/support-inbox-query.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Permissions } from "../../common/decorators/permissions.decorator";
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

  @Get("inbox")
  @Permissions("support.manage")
  @ApiOperation({ summary: "Platform destek gelen kutusu" })
  getInbox(@Query() query: SupportInboxQueryDto) {
    return this.supportService.getInbox(query);
  }

  @Get("inbox/:id")
  @Permissions("support.manage")
  @ApiOperation({ summary: "Platform destek talebi detayı" })
  getInboxTicket(@Param("id") id: string) {
    return this.supportService.getInboxTicket(id);
  }

  @Patch("inbox/:id/status")
  @Permissions("support.manage")
  @ApiOperation({ summary: "Destek talebi durumunu güncelle" })
  updateInboxStatus(@Param("id") id: string, @Body() body: UpdateTicketStatusDto) {
    return this.supportService.updateStatus(id, body.status);
  }

  @Post("inbox/:id/reply")
  @Permissions("support.manage")
  @ApiOperation({ summary: "Destek talebine platform yanıtı ekle" })
  replyInbox(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() body: CreateTicketMessageDto,
  ) {
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
