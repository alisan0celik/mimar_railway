import { Redirect } from "expo-router";

export default function PendingApprovalRedirect() {
  return <Redirect href="/(auth)/approval-pending" />;
}
