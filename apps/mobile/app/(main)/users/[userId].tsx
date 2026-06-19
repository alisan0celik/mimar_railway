import { useLocalSearchParams } from "expo-router";

import { UserDetailScreen } from "../../../src/features/users/screens/UserDetailScreen";

export default function UserDetailRoute() {
  const params = useLocalSearchParams<{ userId?: string }>();
  const userId = params.userId ?? "";

  return <UserDetailScreen userId={userId} />;
}
