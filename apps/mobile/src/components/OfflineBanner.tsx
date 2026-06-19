import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { useTranslation } from "../shared/i18n";
import { useNetworkStatus } from "../offline/network/network-monitor";
import { useOfflineStore } from "../store/offlineStore";
import { spacing, typography } from "../shared/theme";
import { useThemedStyles, type AppColors } from "../shared/theme";

export function OfflineBanner() {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const { isOnline } = useNetworkStatus();
  const pendingCount = useOfflineStore((s) => s.pendingCount);

  if (isOnline && pendingCount === 0) {
    return null;
  }

  const message = isOnline
    ? t("offline.syncing", { count: pendingCount })
    : t("offline.offlineMessage");

  return (
    <View style={[styles.banner, !isOnline && styles.bannerOffline]}>
      <MaterialCommunityIcons color="#fff" name={isOnline ? "sync" : "wifi-off"} size={16} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    banner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      backgroundColor: colors.warning,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
    },
    bannerOffline: {
      backgroundColor: colors.danger,
    },
    text: {
      ...typography.caption,
      color: "#fff",
      fontWeight: "600",
    },
  });
}
