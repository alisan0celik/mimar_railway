import { Redirect } from "expo-router";

export default function CompletedTabRedirect() {
  return <Redirect href="/(main)/(tabs)/projects" />;
}
