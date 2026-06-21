import { useLocalSearchParams } from "expo-router";

import { CreateRoleScreen } from "../../../src/features/roles/screens/CreateRoleScreen";

export default function CreateRoleRoute() {
  const params = useLocalSearchParams<{ roleId?: string; pendingUserId?: string }>();

  return (
    <CreateRoleScreen
      pendingUserId={typeof params.pendingUserId === "string" ? params.pendingUserId : undefined}
      roleId={typeof params.roleId === "string" ? params.roleId : undefined}
    />
  );
}
