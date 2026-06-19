import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

import { radius, spacing, typography } from "../theme";
import { useThemedStyles, type AppColors } from "../theme";
import { useThemeColors } from "../theme/ThemeProvider";

export type AppHeaderProps = {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function AppHeader({
  title,
  subtitle,
  showBack = true,
  onBack,
  rightAction,
  style,
}: AppHeaderProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const router = useRouter();
  const handleBackPress = onBack ?? (() => router.back());

  return (
    <View style={[styles.container, style]}>
      <View style={styles.left}>
        {showBack ? (
          <Pressable
            accessibilityLabel="Geri"
            accessibilityRole="button"
            hitSlop={12}
            onPress={handleBackPress}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons color={colors.text} name="chevron-left" size={24} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.textBlock}>
        {title ? (
          <Text numberOfLines={2} style={styles.title}>
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text numberOfLines={2} style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.right}>{rightAction ?? null}</View>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  container: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
    minHeight: 44,
  },
  left: {
    width: 44,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.cardSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.85,
  },
  textBlock: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    justifyContent: "center",
  },
  title: {
    ...typography.h3,
    color: colors.text,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  right: {
    minWidth: 44,
    alignItems: "flex-end",
    justifyContent: "center",
  },
});
}
