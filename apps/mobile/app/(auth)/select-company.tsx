import { Redirect } from "expo-router";

export default function SelectCompanyRedirect() {
  return <Redirect href="/(auth)/company-select" />;
}
