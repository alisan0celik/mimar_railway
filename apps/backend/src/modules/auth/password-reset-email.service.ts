import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class PasswordResetEmailService {
  private readonly logger = new Logger(PasswordResetEmailService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendResetLink(email: string, token: string): Promise<string> {
    const resetUrl = this.buildResetUrl(token);
    const apiKey = this.configService.get<string>("RESEND_API_KEY")?.trim();
    const from = this.configService.get<string>("MAIL_FROM")?.trim();
    const appName = this.configService.get<string>("APP_NAME")?.trim() || "Mimar";

    if (!apiKey || !from) {
      if (process.env.NODE_ENV !== "production") {
        this.logger.warn(`Password reset email is not configured. Reset link for ${email}: ${resetUrl}`);
        return resetUrl;
      }

      this.logger.error("Password reset email is not configured. Set RESEND_API_KEY and MAIL_FROM.");
      throw new InternalServerErrorException("Şifre sıfırlama e-postası gönderilemedi");
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: email,
        subject: `${appName} şifre sıfırlama`,
        html: this.renderHtml(appName, resetUrl, this.buildLogoUrl(resetUrl)),
        text: this.renderText(appName, resetUrl),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      this.logger.error(`Password reset email failed: ${response.status} ${errorText}`);
      throw new InternalServerErrorException("Şifre sıfırlama e-postası gönderilemedi");
    }

    return resetUrl;
  }

  /**
   * Logonun mutlak adresi.
   *
   * Sıfırlama adresiyle aynı kökten türetilir; alan adı değişse bile görsel
   * doğru yerden gelir. E-posta istemcileri göreli adresleri ve data: URI'leri
   * göstermediği için mutlak adres zorunlu.
   */
  private buildLogoUrl(resetUrl: string): string {
    return new URL("/brand/logo.png", resetUrl).toString();
  }

  private buildResetUrl(token: string): string {
    const configuredUrl =
      this.configService.get<string>("PASSWORD_RESET_URL")?.trim() ||
      "http://localhost:8081/reset-password";
    const url = new URL(configuredUrl);
    url.searchParams.set("token", token);
    return url.toString();
  }

  private renderText(appName: string, resetUrl: string): string {
    return [
      `${appName} hesabınız için şifre sıfırlama talebi aldık.`,
      "",
      `Yeni şifre belirlemek için bu bağlantıyı açın: ${resetUrl}`,
      "",
      "Bu bağlantı 1 saat geçerlidir. Bu işlemi siz başlatmadıysanız bu e-postayı yok sayabilirsiniz.",
    ].join("\n");
  }

  private renderHtml(appName: string, resetUrl: string, logoUrl: string): string {
    /*
     * E-posta istemcileri modern CSS'in çoğunu desteklemiyor; yerleşim
     * tablolarla ve satır içi stille kurulur. Görseller varsayılan olarak
     * engellenebildiği için logonun altında yazıyla marka adı da bulunur:
     * görsel gelmese bile e-postanın kimden geldiği belli olur.
     */
    return `
      <div style="margin:0;padding:24px;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e4e4e7">
          <tr>
            <td align="center" style="padding:28px 24px 8px 24px">
              <img src="${logoUrl}" width="64" height="64" alt="${appName}"
                   style="display:block;width:64px;height:64px;border:0;border-radius:14px" />
              <div style="margin-top:10px;font-size:18px;font-weight:bold;color:#0B1B2E">${appName}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 0 28px;color:#172033;font-size:15px;line-height:1.6">
              <h2 style="margin:16px 0 8px 0;font-size:18px;color:#0B1B2E">Şifre sıfırlama</h2>
              <p style="margin:0 0 16px 0">Hesabınız için şifre sıfırlama talebi aldık.</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:8px 28px 4px 28px">
              <a href="${resetUrl}" style="display:inline-block;background:#F97316;color:#ffffff;padding:13px 26px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px">
                Yeni şifre belirle
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 28px 28px;color:#6b7280;font-size:13px;line-height:1.6">
              <p style="margin:0 0 6px 0">Bu bağlantı 1 saat geçerlidir.</p>
              <p style="margin:0">Bu işlemi siz başlatmadıysanız bu e-postayı yok sayabilirsiniz.</p>
            </td>
          </tr>
        </table>
      </div>
    `;
  }
}
