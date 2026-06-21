import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import type { Provider } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { PasswordResetEmailService } from "./password-reset-email.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { JwtRefreshStrategy } from "./strategies/jwt-refresh.strategy";
import { GoogleStrategy } from "./strategies/google.strategy";
import { AppleStrategy } from "./strategies/apple.strategy";
import { GoogleAuthService } from "./social/google-auth.service";
import { AppleAuthService } from "./social/apple-auth.service";
import { PrismaService } from "../../common/prisma.service";
import { FirebaseConfig } from "../../config/firebase.config";
import { getJwtAccessSecret } from "../../config/jwt.config";
import { AuthRateLimitGuard } from "../../common/guards/auth-rate-limit.guard";

function getOptionalSocialStrategyProviders(): Provider[] {
  const providers: Provider[] = [GoogleAuthService, AppleAuthService];

  if (process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim()) {
    providers.push(GoogleStrategy);
  }

  if (
    process.env.APPLE_CLIENT_ID?.trim() &&
    process.env.APPLE_TEAM_ID?.trim() &&
    process.env.APPLE_KEY_ID?.trim() &&
    process.env.APPLE_PRIVATE_KEY?.trim()
  ) {
    providers.push(AppleStrategy);
  }

  return providers;
}

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const expiresIn = configService.get<string>("JWT_ACCESS_EXPIRATION") || "15m";
        return {
          secret: getJwtAccessSecret(configService),
          signOptions: { expiresIn: expiresIn as any },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordResetEmailService,
    AuthRateLimitGuard,
    JwtStrategy,
    JwtRefreshStrategy,
    ...getOptionalSocialStrategyProviders(),
    PrismaService,
    FirebaseConfig,
  ],
  exports: [AuthService],
})
export class AuthModule {}
