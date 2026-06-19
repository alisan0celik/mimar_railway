import { SetMetadata } from "@nestjs/common";

export const PERMISSIONS_ANY_KEY = "permissionsAny";

/** Requires at least one of the listed permissions. */
export const PermissionsAny = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_ANY_KEY, permissions);
