import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { radius, spacing, typography } from "../theme";
import { useThemedStyles, type AppColors } from "../theme";
import { useThemeColors } from "../theme/ThemeProvider";

export type DesignSegmentTab = {
  key: string;
  label: string;
  count?: number;
};

type DesignSegmentTabsProps = {
  tabs: DesignSegmentTab[];
  activeKey: string;
  onChange: (key: string) => void;
  /** PNG Projeler: yuvarlatılmış dikdörtgen; bildirimler: pill */
  shape?: "pill" | "rounded";
};

export function DesignSegmentTabs({
  tabs,
  activeKey,
  onChange,
  shape = "pill",
}: DesignSegmentTabsProps) {
  const styles = useThemedStyles(createStyles);
  const chipRadius = shape === "rounded" ? radius.lg : radius.full;

  return (
    <ScrollView
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.row}
    >
      {tabs.map((tab) => {
        const active = tab.key === activeKey;
        const label = tab.count !== undefined ? `${tab.label} ${tab.count}` : tab.label;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={[
              styles.chip,
              { borderRadius: chipRadius },
              shape === "rounded" && styles.chipRounded,
              active && styles.chipActive,
            ]}
          >
            <Text numberOfLines={1} style={[styles.chipText, active && styles.chipTextActive]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  scroll: {
    flexGrow: 0,
    maxHeight: 44,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  chip: {
    flexShrink: 0,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
  },
  chipRounded: {
    backgroundColor: colors.surfaceMuted,
    borderColor: "transparent",
    minHeight: 40,
    justifyContent: "center",
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primaryGlow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 3,
  },
  chipText: {
    ...typography.bodySmall,
    color: colors.textMuted,
    fontWeight: "600",
  },
  chipTextActive: { color: colors.white },
});
}
