import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AnnouncementsController } from "./announcements.controller";
import { AnnouncementsService } from "./announcements.service";
import { NotificationsController } from "./notifications.controller";
import { NotificationsGateway } from "./notifications.gateway";
import { NotificationsService } from "./notifications.service";
import { FcmService } from "./fcm.service";
import { SubscriptionReminderService } from "./subscription-reminder.service";
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
  controllers: [NotificationsController, AnnouncementsController],
  providers: [
    AnnouncementsService,
    NotificationsGateway,
    NotificationsService,
    FcmService,
    FirebaseConfig,
    SubscriptionReminderService,
  ],
  exports: [FcmService, NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
