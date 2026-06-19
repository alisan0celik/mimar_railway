import { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import { ThemeProvider, useThemeColors } from "../src/shared/theme";
import { useAuthStore } from "../src/store/authStore";
import { onAuthSessionExpired } from "../src/services/auth/auth-session";
import { OfflineBanner } from "../src/components/OfflineBanner";
import { initSyncEngine } from "../src/offline/sync/sync-engine";
import { initSyncNotificationListener } from "../src/offline/sync/sync-listener";
import { registerBackgroundSyncAsync } from "../src/offline/sync/background-sync";
import { PushBootstrap } from "../src/features/notifications/PushBootstrap";
import { initNotificationRouter } from "../src/services/notification/notification.service";

function RootShell() {
  const colors = useThemeColors();
  const isWeb = Platform.OS === "web";
  const router = useRouter();
  const isLoading = useAuthStore((s) => s.isLoading);
  const hydrate = useAuthStore((s) => s.hydrate);

  const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    rootWeb: { alignItems: "center", justifyContent: "center" },
    mobileShell: { flex: 1, width: "100%", backgroundColor: colors.background },
    mobileShellWeb: {
      maxWidth: 430,
      minHeight: "100%",
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: colors.border,
    },
    stackContent: { backgroundColor: colors.background },
    loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  });

  useEffect(() => {
    hydrate();
    initSyncEngine();
    initSyncNotificationListener();
    initNotificationRouter();
    registerBackgroundSyncAsync();
  }, []);

  useEffect(() => {
    return onAuthSessionExpired(() => {
      router.replace("/(auth)/login");
    });
  }, [router]);

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.root, isWeb && styles.rootWeb]}>
      <View style={[styles.mobileShell, isWeb && styles.mobileShellWeb]}>
        <OfflineBanner />
        <PushBootstrap />
        <Stack screenOptions={{ headerShown: false, contentStyle: styles.stackContent }} />
      </View>
    </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootShell />
    </ThemeProvider>
  );
}
