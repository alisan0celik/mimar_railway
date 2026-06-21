import { Stack } from "expo-router";

import { useThemeColors } from "../../src/shared/theme";

export default function MainLayout() {
  const colors = useThemeColors();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen
        name="(tabs)"
        options={{ headerShown: false, animation: "none" }}
      />
      <Stack.Screen name="settings" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="finance" />
      <Stack.Screen name="projects" />
      <Stack.Screen name="companies" />
      <Stack.Screen name="users" />
      <Stack.Screen name="roles" />
      <Stack.Screen name="team" />
      <Stack.Screen name="platform" />
    </Stack>
  );
}
