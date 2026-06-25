import { Injectable, UnauthorizedException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FirebaseConfig } from "../../../config/firebase.config";
import { verifyOpenIdToken } from "./openid-token-verifier";

@Injectable()
export class GoogleAuthService {
  private readonly logger = new Logger(GoogleAuthService.name);

  constructor(
    private readonly firebaseConfig: FirebaseConfig,
    private readonly configService: ConfigService,
  ) {}

  async verifyToken(idToken: string): Promise<{ email: string; fullName: string; socialId: string }> {
    const audiences = [
      this.configService.get<string>("GOOGLE_CLIENT_ID"),
      this.configService.get<string>("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID"),
      this.configService.get<string>("GOOGLE_ANDROID_CLIENT_ID"),
      this.configService.get<string>("GOOGLE_IOS_CLIENT_ID"),
    ].filter((value): value is string => !!value?.trim());

    if (audiences.length > 0) {
      try {
        const decoded = await verifyOpenIdToken({
          audience: audiences,
          issuer: (issuer) => issuer === "https://accounts.google.com" || issuer === "accounts.google.com",
          jwksUrl: "https://www.googleapis.com/oauth2/v3/certs",
          providerName: "Google",
          token: idToken,
        });

        const email = decoded.email;
        if (!email) {
          throw new UnauthorizedException("Google hesabından e-posta alınamadı");
        }

        return {
          email,
          fullName: decoded.name || email.split("@")[0] || "Google Kullanıcısı",
          socialId: String(decoded.sub),
        };
      } catch (error) {
        this.logger.error("Google token verification failed", error);
      }
    }

    const firebaseAuth = this.firebaseConfig.auth;

    if (firebaseAuth) {
      try {
        const decoded = await firebaseAuth.verifyIdToken(idToken);
        return {
          email: decoded.email || "",
          fullName: decoded.name || decoded.email?.split("@")[0] || "Google Kullanıcısı",
          socialId: decoded.uid,
        };
      } catch (error) {
        this.logger.error("Firebase token verification failed", error);
      }
    }

    throw new UnauthorizedException("Google token doğrulaması başarısız");
  }
}
