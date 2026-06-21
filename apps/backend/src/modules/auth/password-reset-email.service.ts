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
        html: this.renderHtml(appName, resetUrl),
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

  private renderHtml(appName: string, resetUrl: string): string {
    return `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033">
        <h2>${appName} şifre sıfırlama</h2>
        <p>Hesabınız için şifre sıfırlama talebi aldık.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 18px;border-radius:6px;text-decoration:none;font-weight:700">
            Yeni şifre belirle
          </a>
        </p>
        <p>Bu bağlantı 1 saat geçerlidir.</p>
        <p>Bu işlemi siz başlatmadıysanız bu e-postayı yok sayabilirsiniz.</p>
      </div>
    `;
  }
}
