import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#050A18" },
      }}
    >
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="company-select" />
      <Stack.Screen name="approval-pending" />
      <Stack.Screen name="select-company" />
      <Stack.Screen name="join-request" />
      <Stack.Screen name="pending-approval" />
      <Stack.Screen name="create-company" />
    </Stack>
  );
}
