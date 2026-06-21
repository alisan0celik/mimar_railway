import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { spacing, typography } from "../theme";
import { useThemedStyles, type AppColors } from "../theme";
import { useThemeColors } from "../theme/ThemeProvider";

type SectionTitleProps = {
  title: string;
  subtitle?: string;
  rightAction?: ReactNode;
  compact?: boolean;
};

export function SectionTitle({ title, subtitle, rightAction, compact = false }: SectionTitleProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {rightAction ? <View style={styles.action}>{rightAction}</View> : null}
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  container: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  containerCompact: {
    marginBottom: spacing.md,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.text,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  action: {
    marginLeft: spacing.md,
  },
});
}
