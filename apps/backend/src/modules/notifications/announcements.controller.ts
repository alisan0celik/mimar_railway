import { Body, Controller, ForbiddenException, Get, Post } from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";

import { ApiProtectedController } from "../../common/decorators/api-docs.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtPayload } from "../../common/interfaces/jwt-payload.interface";
import { isPlatformAdminEmail } from "../../common/subscription.util";
import { AnnouncementsService } from "./announcements.service";
import { CreateAnnouncementDto } from "./dto/create-announcement.dto";

/**
 * Bütün kullanıcılara duyuru. Yalnızca platform yöneticileri
 * (`PLATFORM_ADMIN_EMAILS`) kullanabilir; şirket kapsamı yok, duyuru her
 * şirketin her kullanıcısına gider.
 */
@Controller("announcements")
@ApiProtectedController("Notifications")
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  private assertPlatformAdmin(user: JwtPayload) {
    if (!isPlatformAdminEmail(user.email)) {
      throw new ForbiddenException("Bu alan sadece platform yöneticisine açıktır");
    }
  }

  @Get("audience")
  @ApiOperation({ summary: "Duyurunun kaç kişiye ulaşacağı" })
  audience(@CurrentUser() user: JwtPayload) {
    this.assertPlatformAdmin(user);
    return this.announcementsService.audience();
  }

  @Post()
  @ApiOperation({ summary: "Bütün kullanıcılara duyuru gönder" })
  send(@CurrentUser() user: JwtPayload, @Body() body: CreateAnnouncementDto) {
    this.assertPlatformAdmin(user);
    return this.announcementsService.broadcast(user.sub, body);
  }
}
