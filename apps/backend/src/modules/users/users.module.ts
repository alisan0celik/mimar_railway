import { Module, forwardRef } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { PrismaService } from "../../common/prisma.service";
import { CommonModule } from "../../common/common.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { CompaniesModule } from "../companies/companies.module";

@Module({
  imports: [CommonModule, NotificationsModule, forwardRef(() => CompaniesModule)],
  controllers: [UsersController],
  providers: [UsersService, PrismaService],
  exports: [UsersService],
})
export class UsersModule {}
