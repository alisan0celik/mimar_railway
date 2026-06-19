import { useEffect, useRef } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { router, useSegments } from "expo-router";
import { useThemeColors } from "../src/shared/theme";
import { hasSeenOnboarding } from "../src/services/auth/onboarding-storage";
import { useAuthStore } from "../src/store/authStore";

export default function IndexScreen() {
  const colors = useThemeColors();
  const mounted = useRef(true);
  const segments = useSegments();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboarding = segments[0] === "onboarding";

    if (inAuthGroup || inOnboarding) return;

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

    const bootstrap = async () => {
      try {
        const seen = await hasSeenOnboarding();
        if (!mounted.current) return;

        if (seen) {
          router.replace("/(auth)/login");
        } else {
          router.replace("/onboarding");
        }
      } catch {
        if (mounted.current) {
          router.replace("/onboarding");
        }
      }
    };

    bootstrap();
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
