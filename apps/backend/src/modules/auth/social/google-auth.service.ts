import { Injectable, UnauthorizedException, Logger } from "@nestjs/common";
import { FirebaseConfig } from "../../../config/firebase.config";

@Injectable()
export class GoogleAuthService {
  private readonly logger = new Logger(GoogleAuthService.name);

  constructor(private readonly firebaseConfig: FirebaseConfig) {}

  async verifyToken(idToken: string): Promise<{ email: string; fullName: string; socialId: string }> {
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
