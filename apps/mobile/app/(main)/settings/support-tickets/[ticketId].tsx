import { useLocalSearchParams } from "expo-router";

import { TicketDetailScreen } from "../../../../src/features/settings/screens/TicketDetailScreen";

export default function TicketDetailRoute() {
  const params = useLocalSearchParams<{ ticketId?: string }>();
  return <TicketDetailScreen ticketId={params.ticketId ?? ""} />;
}
