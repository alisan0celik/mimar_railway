import { useLocalSearchParams } from "expo-router";

import { RolesScreen } from "../../../src/features/roles/screens/RolesScreen";

export default function RolesRoute() {
  const params = useLocalSearchParams<{ pendingUserId?: string }>();
  const pendingUserId = typeof params.pendingUserId === "string" ? params.pendingUserId : undefined;

  return <RolesScreen pendingUserId={pendingUserId} />;
}
