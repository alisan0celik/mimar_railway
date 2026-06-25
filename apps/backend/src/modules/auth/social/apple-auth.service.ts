import { Injectable, UnauthorizedException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FirebaseConfig } from "../../../config/firebase.config";
import { verifyOpenIdToken } from "./openid-token-verifier";

@Injectable()
export class AppleAuthService {
  private readonly logger = new Logger(AppleAuthService.name);

  constructor(
    private readonly firebaseConfig: FirebaseConfig,
    private readonly configService: ConfigService,
  ) {}

  async verifyToken(idToken: string): Promise<{ email: string; fullName: string; socialId: string }> {
    const audiences = [
      this.configService.get<string>("APPLE_CLIENT_ID"),
      this.configService.get<string>("APPLE_BUNDLE_ID"),
      this.configService.get<string>("IOS_BUNDLE_ID"),
    ].filter((value): value is string => !!value?.trim());

    if (audiences.length > 0) {
      try {
        const decoded = await verifyOpenIdToken({
          audience: audiences,
          issuer: "https://appleid.apple.com",
          jwksUrl: "https://appleid.apple.com/auth/keys",
          providerName: "Apple",
          token: idToken,
        });

        const email = decoded.email || `${decoded.sub}@private.apple.com`;
        return {
          email,
          fullName: decoded.name || email.split("@")[0] || "Apple Kullanıcısı",
          socialId: String(decoded.sub),
        };
      } catch (error) {
        this.logger.error("Apple token verification failed", error);
      }
    }

    const firebaseAuth = this.firebaseConfig.auth;

    if (firebaseAuth) {
      try {
        const decoded = await firebaseAuth.verifyIdToken(idToken);
        return {
          email: decoded.email || `${decoded.uid}@private.apple.com`,
          fullName: decoded.name || decoded.email?.split("@")[0] || "Apple Kullanıcısı",
          socialId: decoded.uid,
        };
      } catch (error) {
        this.logger.error("Firebase Apple token verification failed", error);
      }
    }

    throw new UnauthorizedException("Apple token doğrulaması başarısız");
  }
}
