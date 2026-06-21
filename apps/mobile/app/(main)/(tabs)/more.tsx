import { Redirect } from "expo-router";

export default function MoreTabRedirect() {
  return <Redirect href="/(main)/(tabs)/profile" />;
}
