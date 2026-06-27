import { Module } from "@nestjs/common";
import { FinanceController } from "./finance.controller";
import { FinanceService } from "./finance.service";
import { PrismaService } from "../../common/prisma.service";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [NotificationsModule],
  controllers: [FinanceController],
  providers: [FinanceService, PrismaService],
})
export class FinanceModule {}
