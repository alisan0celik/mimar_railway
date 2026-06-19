import { Module } from "@nestjs/common";
import { SupportController } from "./support.controller";
import { SupportService } from "./support.service";
import { PrismaService } from "../../common/prisma.service";
import { NotificationsModule } from "../notifications/notifications.module";
import { CompanyScopeService } from "../../common/tenant/company-scope.service";

@Module({
  imports: [NotificationsModule],
  controllers: [SupportController],
  providers: [SupportService, PrismaService, CompanyScopeService],
})
export class SupportModule {}
