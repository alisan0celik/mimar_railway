import type { Href } from "expo-router";
import type { ReactNode } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { spacing, typography } from "../theme";
import { useThemedStyles, type AppColors } from "../theme";
import { useThemeColors } from "../theme/ThemeProvider";
import { DesignStatusBadge } from "./DesignStatusBadge";

type DesignBackHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  fallbackRoute?: Href;
  badge?: { label: string; variant: "success" | "warning" | "danger" | "info" };
  right?: ReactNode;
};

export function DesignBackHeader({
  title,
  subtitle,
  onBack,
  fallbackRoute,
  badge,
  right,
}: DesignBackHeaderProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    if (fallbackRoute) {
      router.replace(fallbackRoute);
    }
  };

  return (
    <View style={styles.wrap}>
      <Pressable onPress={handleBack} style={styles.backBtn}>
        <MaterialCommunityIcons color={colors.text} name="arrow-left" size={24} />
      </Pressable>
      <View style={styles.titleBlock}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {badge ? (
        <DesignStatusBadge label={badge.label} variant={badge.variant} />
      ) : (
        right ?? <View style={styles.spacer} />
      )}
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  titleBlock: { flex: 1 },
  title: {
    ...typography.h3,
    color: colors.text,
    fontWeight: "700",
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  spacer: { width: 40 },
});
}
