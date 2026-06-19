import { ConfigService } from "@nestjs/config";

export function getJwtAccessSecret(configService: ConfigService): string {
  const secret = configService.get<string>("JWT_ACCESS_SECRET");
  if (!secret) {
    throw new Error("JWT_ACCESS_SECRET environment variable is required");
  }
  return secret;
}

export function getJwtRefreshSecret(configService: ConfigService): string {
  const secret = configService.get<string>("JWT_REFRESH_SECRET");
  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET environment variable is required");
  }
  return secret;
}
