import { useLocalSearchParams } from "expo-router";

import { AddPaymentScreen } from "../../../src/features/finance/screens/AddPaymentScreen";

export default function AddPaymentRoute() {
  const params = useLocalSearchParams<{
    projectId?: string;
    transactionId?: string;
    editingTransaction?: string;
  }>();
  return (
    <AddPaymentScreen
      editingTransaction={params.editingTransaction}
      projectId={params.projectId}
      transactionId={params.transactionId}
    />
  );
}
