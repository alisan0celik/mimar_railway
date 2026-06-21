import { Injectable, UnauthorizedException, Logger } from "@nestjs/common";
import { FirebaseConfig } from "../../../config/firebase.config";

@Injectable()
export class AppleAuthService {
  private readonly logger = new Logger(AppleAuthService.name);

  constructor(private readonly firebaseConfig: FirebaseConfig) {}

  async verifyToken(idToken: string): Promise<{ email: string; fullName: string; socialId: string }> {
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
