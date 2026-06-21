import { StyleSheet, Text, View } from "react-native";

import { spacing, typography } from "../theme";
import { useThemedStyles, type AppColors } from "../theme";
import { useThemeColors } from "../theme/ThemeProvider";

type DesignSectionTitleProps = {
  title: string;
  subtitle?: string;
};

export function DesignSectionTitle({ title, subtitle }: DesignSectionTitleProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
});
}
