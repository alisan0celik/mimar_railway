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

const AUTH_GRADIENT = ["#050A18", "#0B1120"] as const;
const AUTH_CARD_BG = "rgba(26,35,50,0.72)";
const AUTH_CARD_BORDER = "rgba(148,163,184,0.12)";

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
  const content = (
    <View style={[styles.inner, contentContainerStyle]}>
      {children}
    </View>
  );

  return (
    <LinearGradient colors={[...AUTH_GRADIENT]} style={styles.gradient}>
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
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
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
    backgroundColor: AUTH_CARD_BG,
    borderWidth: 1,
    borderColor: AUTH_CARD_BORDER,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
  },
});
