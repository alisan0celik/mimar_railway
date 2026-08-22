import { Controller, Get, Header, Query } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";

import { Public } from "../../common/decorators/public.decorator";
import { renderResetPasswordPage } from "./password-reset-page.template";

/**
 * E-postadaki bağlantının açtığı şifre sıfırlama sayfası.
 *
 * Bağlantı `PASSWORD_RESET_URL` ile yapılandırılıyordu ama karşılığında hiçbir
 * sayfa sunulmuyordu; kullanıcı 404 görüyordu. Sayfa API'nin kendisinden
 * sunulur, böylece ayrı bir web barındırma gerekmez ve bağlantı hem telefonda
 * hem masaüstünde çalışır.
 *
 * Global `/api` öneki dışında kalması gerekiyor: bağlantı insanlara gidiyor,
 * API yoluna değil.
 */
@Controller()
@ApiExcludeController()
export class PasswordResetPageController {
  @Public()
  @Get("reset-password")
  @Header("Content-Type", "text/html; charset=utf-8")
  @Header("Cache-Control", "no-store")
  page(@Query("token") token?: string) {
    return renderResetPasswordPage(token ?? "");
  }
}
