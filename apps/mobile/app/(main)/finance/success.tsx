import { useLocalSearchParams } from "expo-router";
import { FinanceSuccessScreen } from "../../../src/features/finance/screens/FinanceSuccessScreen";

export default function FinanceSuccessRoute() {
  const params = useLocalSearchParams<{
    title?: string;
    subtitle?: string;
    backRoute?: string;
  }>();

  return (
    <FinanceSuccessScreen
      title={params.title}
      subtitle={params.subtitle}
      backRoute={params.backRoute}
    />
  );
}
