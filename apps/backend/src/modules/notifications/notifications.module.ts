import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { NotificationsController } from "./notifications.controller";
import { NotificationsGateway } from "./notifications.gateway";
import { NotificationsService } from "./notifications.service";
import { FcmService } from "./fcm.service";
import { FirebaseConfig } from "../../config/firebase.config";
import { getJwtAccessSecret } from "../../config/jwt.config";

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: getJwtAccessSecret(configService),
      }),
    }),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsGateway, NotificationsService, FcmService, FirebaseConfig],
  exports: [FcmService, NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
