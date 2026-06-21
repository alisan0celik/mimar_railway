import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Animated, StyleSheet, Text, View } from "react-native";

import { spacing, typography } from "../theme";
import { useThemedStyles, type AppColors } from "../theme";

type SuccessStateLayoutProps = {
  icon: ReactNode;
  title: string;
  description?: string;
  children?: ReactNode;
  action: ReactNode;
  secondaryAction?: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  animate?: boolean;
  tone?: "default" | "auth";
};

export function SuccessStateLayout({
  icon,
  title,
  description,
  children,
  action,
  secondaryAction,
  contentContainerStyle,
  animate = true,
  tone = "default",
}: SuccessStateLayoutProps) {
  const styles = useThemedStyles((colors) => createStyles(colors, tone));
  const scale = useRef(new Animated.Value(animate ? 0 : 1)).current;
  const opacity = useRef(new Animated.Value(animate ? 0 : 1)).current;

  useEffect(() => {
    if (!animate) return;

    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [animate, opacity, scale]);

  return (
    <View style={[styles.container, contentContainerStyle]}>
      <Animated.View style={[styles.center, { opacity, transform: [{ scale }] }]}>
        <View style={styles.iconWrap}>{icon}</View>
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
        {children}
      </Animated.View>

      <View style={styles.actions}>
        {action}
        {secondaryAction}
      </View>
    </View>
  );
}

function createStyles(colors: AppColors, tone: "default" | "auth") {
  const isAuth = tone === "auth";

  return StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: spacing.xl,
    },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
    },
    iconWrap: {
      marginBottom: spacing.md,
    },
    title: {
      ...typography.h2,
      color: isAuth ? "#FFFFFF" : colors.text,
      fontWeight: "700",
      textAlign: "center",
    },
    description: {
      ...typography.body,
      color: isAuth ? "rgba(255,255,255,0.65)" : colors.textMuted,
      textAlign: "center",
      lineHeight: 24,
      paddingHorizontal: spacing.md,
    },
    actions: {
      paddingVertical: spacing.xxl,
      gap: spacing.md,
    },
  });
}
