import { useLocalSearchParams } from "expo-router";

import { FinanceDetailScreen } from "../../../src/features/finance/screens/FinanceDetailScreen";

export default function FinanceDetailRoute() {
  const params = useLocalSearchParams<{ projectId?: string }>();
  const projectId = params.projectId ?? "";

  return <FinanceDetailScreen projectId={projectId} />;
}
