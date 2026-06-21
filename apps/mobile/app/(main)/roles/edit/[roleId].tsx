import { useLocalSearchParams } from "expo-router";

import { CreateRoleScreen } from "../../../../src/features/roles/screens/CreateRoleScreen";

export default function EditRoleRoute() {
  const params = useLocalSearchParams<{ roleId?: string }>();
  return <CreateRoleScreen roleId={params.roleId} />;
}
