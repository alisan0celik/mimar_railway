import { useLocalSearchParams } from "expo-router";

import { ProgressPaymentScreen } from "../../../../src/features/projects/screens/ProgressPaymentScreen";

export default function ProgressPaymentRoute() {
  const params = useLocalSearchParams<{ projectId?: string }>();
  return <ProgressPaymentScreen projectId={params.projectId ?? ""} />;
}
