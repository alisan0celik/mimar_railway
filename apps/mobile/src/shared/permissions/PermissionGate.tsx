import type { ReactNode } from "react";

import type { PermissionCode } from "./permissions";
import { useCan } from "./useCan";

type PermissionGateProps = {
  permission: PermissionCode;
  children: ReactNode;
  fallback?: ReactNode;
};

export function PermissionGate({
  permission,
  children,
  fallback = null,
}: PermissionGateProps) {
  const canAccess = useCan(permission);

  if (canAccess) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
