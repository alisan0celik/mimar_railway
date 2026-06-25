import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { verifyOpenIdToken } from "./openid-token-verifier";

@Injectable()
export class MicrosoftAuthService {
  constructor(private readonly configService: ConfigService) {}

  async verifyToken(idToken: string): Promise<{ email: string; fullName: string; socialId: string }> {
    const audiences = [
      this.configService.get<string>("MICROSOFT_CLIENT_ID"),
      this.configService.get<string>("EXPO_PUBLIC_MICROSOFT_CLIENT_ID"),
    ].filter((value): value is string => !!value?.trim());

    const decoded = await verifyOpenIdToken({
      audience: audiences,
      issuer: (issuer) =>
        issuer.startsWith("https://login.microsoftonline.com/") && issuer.endsWith("/v2.0"),
      jwksUrl: "https://login.microsoftonline.com/common/discovery/v2.0/keys",
      providerName: "Microsoft",
      token: idToken,
    });

    const email =
      (decoded.email as string | undefined) ||
      (decoded.preferred_username as string | undefined) ||
      (decoded.upn as string | undefined);
    if (!email) {
      throw new UnauthorizedException("Microsoft hesabından e-posta alınamadı");
    }

    const tenantId = String(decoded.tid || "common");
    const objectId = String(decoded.oid || decoded.sub);

    return {
      email,
      fullName: (decoded.name as string | undefined) || email.split("@")[0] || "Microsoft Kullanıcısı",
      socialId: `${tenantId}:${objectId}`,
    };
  }
}
