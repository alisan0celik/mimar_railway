import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { componentTokens, radius, spacing } from "../theme";
import { useThemedStyles, type AppColors } from "../theme";
import { useThemeColors } from "../theme/ThemeProvider";

type AuthScreenShellProps = {
  children: ReactNode;
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  footer?: ReactNode;
};

export function AuthScreenShell({
  children,
  scroll = true,
  contentContainerStyle,
  footer,
}: AuthScreenShellProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();

  const content = (
    <View style={[styles.inner, contentContainerStyle]}>
      {children}
    </View>
  );

  return (
    <LinearGradient
      colors={[colors.backgroundDeep, colors.background]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.flex}
        >
          {scroll ? (
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {content}
            </ScrollView>
          ) : (
            <View style={styles.flex}>{content}</View>
          )}
          {footer}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

type AuthFormCardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function AuthFormCard({ children, style }: AuthFormCardProps) {
  const styles = useThemedStyles(createStyles);
  return <View style={[styles.card, style]}>{children}</View>;
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    gradient: {
      flex: 1,
    },
    safe: {
      flex: 1,
    },
    flex: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: spacing.xxl,
    },
    inner: {
      flex: 1,
      paddingTop: componentTokens.screen.topPadding,
      paddingHorizontal: componentTokens.screen.horizontalPadding,
      paddingBottom: componentTokens.screen.bottomPadding,
    },
    card: {
      // Degradenin üstünde hafif saydam dursun (B8 ≈ %72)
      backgroundColor: `${colors.card}B8`,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.xl,
      padding: spacing.xl,
      gap: spacing.md,
    },
  });
}
