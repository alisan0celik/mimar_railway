import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { CommonModule } from "./common/common.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { CompaniesModule } from "./modules/companies/companies.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { RolesModule } from "./modules/roles/roles.module";
import { CalendarModule } from "./modules/calendar/calendar.module";
import { SupportModule } from "./modules/support/support.module";
import { FinanceModule } from "./modules/finance/finance.module";
import { ProjectsModule } from "./modules/projects/projects.module";
import { SyncModule } from "./modules/sync/sync.module";
import { FirebaseConfig } from "./config/firebase.config";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { PermissionsGuard } from "./common/guards/permissions.guard";
import { CompanyGuard } from "./common/tenant/company.guard";
import { HealthController } from "./health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    CommonModule,
    AuthModule,
    UsersModule,
    CompaniesModule,
    NotificationsModule,
    RolesModule,
    CalendarModule,
    SupportModule,
    FinanceModule,
    ProjectsModule,
    SyncModule,
  ],
  providers: [
    FirebaseConfig,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: CompanyGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
  controllers: [HealthController],
  exports: [FirebaseConfig],
})
export class AppModule {}
