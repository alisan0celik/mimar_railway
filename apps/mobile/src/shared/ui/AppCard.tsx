import type { ReactNode } from "react";
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { radius, shadows, spacing } from "../theme";
import { useThemedStyles, type AppColors } from "../theme";
import { useThemeColors } from "../theme/ThemeProvider";

export type AppCardVariant = "default" | "soft" | "elevated" | "outlined";

type AppCardProps = {
  children: ReactNode;
  onPress?: () => void;
  padding?: number;
  variant?: AppCardVariant;
  bordered?: boolean;
  style?: StyleProp<ViewStyle>;
};

function getcardVariantStyles(colors: AppColors): Record<AppCardVariant, ViewStyle> { return {
  default: {
    backgroundColor: colors.card,
    borderColor: colors.border,
  },
  soft: {
    backgroundColor: colors.cardSoft,
    borderColor: colors.borderLight,
  },
  elevated: {
    backgroundColor: colors.cardElevated,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  outlined: {
    backgroundColor: "transparent",
    borderColor: colors.borderStrong,
  },
 }; }

export function AppCard({
  children,
  onPress,
  padding = spacing.lg,
  variant = "default",
  bordered = true,
  style,
}: AppCardProps) {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const variantStyle = getcardVariantStyles(colors)[variant];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.base,
          variantStyle,
          !bordered && styles.noBorder,
          { padding },
          style,
          pressed && styles.pressed,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[styles.base, variantStyle, !bordered && styles.noBorder, { padding }, style]}>{children}</View>;
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  base: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
  },
  noBorder: {
    borderWidth: 0,
  },
  pressed: {
    opacity: 0.92,
  },
});
}
