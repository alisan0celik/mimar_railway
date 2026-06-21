import { Module } from "@nestjs/common";
import { ProjectsModule } from "../projects/projects.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { SyncController } from "./sync.controller";
import { SyncService } from "./sync.service";
import { SyncNotifyService } from "./sync-notify.service";

@Module({
  imports: [ProjectsModule, NotificationsModule],
  controllers: [SyncController],
  providers: [SyncService, SyncNotifyService],
  exports: [SyncService, SyncNotifyService],
})
export class SyncModule {}
