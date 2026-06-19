import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PERMISSIONS_KEY } from "../decorators/permissions.decorator";
import { PERMISSIONS_ANY_KEY } from "../decorators/permissions-any.decorator";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { PermissionService } from "../permissions/permission.service";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionService: PermissionService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const requiredAll = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const requiredAny = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_ANY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredAll?.length && !requiredAny?.length) return true;

    const { user } = context.switchToHttp().getRequest();
    const effectivePermissions = await this.permissionService.getEffectivePermissions(user.sub);

    if (requiredAll?.length) {
      const hasAll = requiredAll.every((perm) => effectivePermissions.includes(perm));
      if (!hasAll) {
        throw new ForbiddenException("Bu işlem için yetkiniz bulunmamaktadır");
      }
    }

    if (requiredAny?.length) {
      const hasAny = requiredAny.some((perm) => effectivePermissions.includes(perm));
      if (!hasAny) {
        throw new ForbiddenException("Bu işlem için yetkiniz bulunmamaktadır");
      }
    }

    return true;
  }
}
