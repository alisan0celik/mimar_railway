import { useLocalSearchParams } from "expo-router";

import { RoleDetailScreen } from "../../../src/features/roles/screens/RoleDetailScreen";

export default function RoleDetailRoute() {
  const params = useLocalSearchParams<{ roleId?: string }>();
  const roleId = params.roleId ?? "";

  return <RoleDetailScreen roleId={roleId} />;
}
