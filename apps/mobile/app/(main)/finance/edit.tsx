import { useLocalSearchParams } from "expo-router";
import { EditFinanceScreen } from "../../../src/features/finance/screens/EditFinanceScreen";

export default function EditFinanceRoute() {
  const params = useLocalSearchParams<{ projectId?: string }>();
  return <EditFinanceScreen projectId={params.projectId} />;
}
