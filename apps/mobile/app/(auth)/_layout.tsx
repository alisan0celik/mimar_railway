import { Stack } from "expo-router";

import { useThemeColors } from "../../src/shared/theme";

export default function AuthLayout() {
  const colors = useThemeColors();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // Giriş ekranlarının degradesiyle aynı zemin; sabit bırakılırsa
        // seçili temadan bağımsız olarak lacivert kalıyor.
        contentStyle: { backgroundColor: colors.backgroundDeep },
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
