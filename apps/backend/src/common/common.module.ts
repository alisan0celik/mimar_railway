import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { CompanyScopeService } from "./tenant/company-scope.service";
import { PermissionService } from "./permissions/permission.service";

@Global()
@Module({
  providers: [PrismaService, CompanyScopeService, PermissionService],
  exports: [PrismaService, CompanyScopeService, PermissionService],
})
export class CommonModule {}
