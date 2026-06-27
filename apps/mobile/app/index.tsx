import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { router, useSegments } from "expo-router";
import { useThemeColors } from "../src/shared/theme";
import { useAuthStore } from "../src/store/authStore";

export default function IndexScreen() {
  const colors = useThemeColors();
  const segments = useSegments();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (inAuthGroup) return;

    if (isAuthenticated) {
      if (user?.companyId && user.approvalStatus === "pending") {
        router.replace({
          pathname: "/(auth)/approval-pending",
          params: { companyName: user.companyName ?? "" },
        });
        return;
      }

      if (user?.companyId && user.approvalStatus === "approved") {
        router.replace("/(main)/(tabs)/dashboard");
        return;
      }

      if (user?.companyId) {
        router.replace("/(auth)/login");
        return;
      }

      router.replace("/(auth)/company-select");
      return;
    }

    router.replace("/(auth)/login");
  }, [isLoading, isAuthenticated, user?.companyId, user?.approvalStatus]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
