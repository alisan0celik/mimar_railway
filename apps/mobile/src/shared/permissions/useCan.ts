import { useMemo } from "react";

import { useAuthStore } from "../../store/authStore";
import type { PermissionCode } from "./permissions";

export function useCan(permission: PermissionCode): boolean {
  const user = useAuthStore((s) => s.user);

  return useMemo(
    () => user?.permissions?.includes(permission) ?? false,
    [user?.permissions, permission],
  );
}
