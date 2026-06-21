import type { ReactNode } from "react";

import type { PermissionCode } from "../permissions";
import { useCan } from "../permissions";
import { NoPermissionState } from "./NoPermissionState";

type PermissionGateProps = {
  permission: PermissionCode;
  children: ReactNode;
  fallback?: ReactNode;
  useDefaultFallback?: boolean;
};

export function PermissionGate({
  permission,
  children,
  fallback,
  useDefaultFallback = false,
}: PermissionGateProps) {
  const canAccess = useCan(permission);

  if (canAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (useDefaultFallback) {
    return <NoPermissionState />;
  }

  return null;
}
