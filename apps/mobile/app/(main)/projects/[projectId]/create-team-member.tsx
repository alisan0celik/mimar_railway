import { useLocalSearchParams } from "expo-router";

import { CreateTeamMemberScreen } from "../../../../src/features/projects/screens/CreateTeamMemberScreen";

export default function CreateTeamMemberRoute() {
  const params = useLocalSearchParams<{ projectId?: string }>();
  return <CreateTeamMemberScreen projectId={params.projectId ?? ""} />;
}
