import { useLocalSearchParams } from "expo-router";

import { SupportInboxDetailScreen } from "../../../../src/features/platform/screens/SupportInboxDetailScreen";

export default function PlatformSupportTicketRoute() {
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>();
  return <SupportInboxDetailScreen ticketId={ticketId ?? ""} />;
}
