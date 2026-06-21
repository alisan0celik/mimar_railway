import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

import { radius, spacing, typography } from "../theme";
import { useThemedStyles, type AppColors } from "../theme";
import { useThemeColors } from "../theme/ThemeProvider";

export type AppButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type AppButtonSize = "sm" | "md" | "lg";

type AppButtonProps = {
  title: string;
  onPress: () => void;
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

type ButtonVariantStyle = {
  container: ViewStyle;
  textColor: string;
};

function getbuttonVariantStyles(colors: AppColors): Record<AppButtonVariant, ButtonVariantStyle> { return {
  primary: {
    container: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    textColor: colors.white,
  },
  secondary: {
    container: {
      backgroundColor: colors.cardSoft,
      borderColor: colors.borderStrong,
    },
    textColor: colors.text,
  },
  danger: {
    container: {
      backgroundColor: colors.dangerLogout,
      borderColor: colors.dangerLogout,
    },
    textColor: colors.white,
  },
  ghost: {
    container: {
      backgroundColor: "transparent",
      borderColor: colors.borderStrong,
    },
    textColor: colors.textSoft,
  },
 }; }

const buttonSizeStyles: Record<
  AppButtonSize,
  { container: ViewStyle; text: TextStyle }
> = {
  sm: {
    container: {
      minHeight: 40,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    text: {
      fontSize: 14,
      lineHeight: 18,
    },
  },
  md: {
    container: {
      minHeight: 48,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    text: {
      fontSize: 16,
      lineHeight: 20,
    },
  },
  lg: {
    container: {
      minHeight: 60,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
    },
    text: {
      fontSize: 18,
      lineHeight: 24,
    },
  },
};

export function AppButton({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
}: AppButtonProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const variantStyle = getbuttonVariantStyles(colors)[variant];
  const sizeStyle = buttonSizeStyles[size];
  const isDisabled = disabled || loading;
  const showPrimaryShadow = variant === "primary" && !isDisabled;
  const useGradient = variant === "primary" && !isDisabled;

  const inner = loading ? (
    <ActivityIndicator color={variantStyle.textColor} />
  ) : (
    <View style={styles.content}>
      {leftIcon ? <View style={styles.iconLeft}>{leftIcon}</View> : null}
      <Text
        style={[
          typography.button,
          sizeStyle.text,
          { color: variantStyle.textColor },
          textStyle,
        ]}
      >
        {title}
      </Text>
      {rightIcon ? <View style={styles.iconRight}>{rightIcon}</View> : null}
    </View>
  );

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        sizeStyle.container,
        !useGradient && variantStyle.container,
        showPrimaryShadow && styles.primaryShadow,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        useGradient && styles.gradientOverflow,
        style,
      ]}
    >
      {useGradient ? (
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={[StyleSheet.absoluteFill, styles.gradientFill]}
        />
      ) : null}
      {inner}
    </Pressable>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  base: {
    borderRadius: radius.xl,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  gradientOverflow: {
    borderColor: colors.primary,
  },
  gradientFill: {
    borderRadius: radius.xl,
  },
  primaryShadow: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.30,
    shadowRadius: 16,
    elevation: 8,
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.85,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
});
}
