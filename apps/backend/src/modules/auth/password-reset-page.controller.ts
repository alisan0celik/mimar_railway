import { Controller, Get, Header, Query, StreamableFile } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";

import { Public } from "../../common/decorators/public.decorator";
import { renderResetPasswordPage } from "./password-reset-page.template";
import { PLANOVA_LOGO_BUFFER } from "./planova-logo";

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
  /**
   * E-postadaki logonun kaynağı.
   *
   * E-posta istemcileri data: URI ile gömülü görselleri engelliyor; görselin
   * herkese açık bir adresten sunulması gerekiyor. Bu yüzden simge burada
   * yayınlanır ve e-postada mutlak adresle gösterilir.
   */
  @Public()
  @Get("brand/logo.png")
  @Header("Content-Type", "image/png")
  @Header("Cache-Control", "public, max-age=604800")
  logo() {
    return new StreamableFile(PLANOVA_LOGO_BUFFER);
  }

  @Public()
  @Get("reset-password")
  @Header("Content-Type", "text/html; charset=utf-8")
  @Header("Cache-Control", "no-store")
  page(@Query("token") token?: string) {
    return renderResetPasswordPage(token ?? "");
  }
}
