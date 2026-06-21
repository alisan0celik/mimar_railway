import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-apple";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, "apple") {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>("APPLE_CLIENT_ID") || "",
      teamID: configService.get<string>("APPLE_TEAM_ID") || "",
      keyID: configService.get<string>("APPLE_KEY_ID") || "",
      privateKeyString: configService.get<string>("APPLE_PRIVATE_KEY") || "",
      callbackURL: "api/auth/apple/callback",
      scope: ["name", "email"],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: any,
  ): Promise<any> {
    const user = {
      email: profile.email || `${profile.id}@private.apple.com`,
      fullName: profile.name?.firstName
        ? `${profile.name.firstName} ${profile.name.lastName || ""}`
        : "Apple Kullanıcısı",
      socialId: profile.id,
      provider: "APPLE",
    };
    done(null, user);
  }
}
