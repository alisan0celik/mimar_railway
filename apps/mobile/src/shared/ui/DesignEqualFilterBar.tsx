import { Pressable, StyleSheet, Text, View } from "react-native";

import { radius, spacing } from "../theme";
import type { AppColors } from "../theme/colors";
import { useThemeColors } from "../theme/ThemeProvider";
import { useThemedStyles } from "../theme/useThemedStyles";

export type EqualFilterTab = {
  key: string;
  label: string;
  count?: number;
};

type DesignEqualFilterBarProps = {
  tabs: EqualFilterTab[];
  activeKey: string;
  onChange: (key: string) => void;
};

export function DesignEqualFilterBar({ tabs, activeKey, onChange }: DesignEqualFilterBarProps) {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.row}>
      {tabs.map((tab) => {
        const active = tab.key === activeKey;
        const label = tab.count !== undefined ? `${tab.label} ${tab.count}` : tab.label;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={[styles.tab, !active && styles.tabInactive, active && styles.tabActive]}
          >
            <Text
              adjustsFontSizeToFit
              minimumFontScale={0.85}
              numberOfLines={1}
              style={[styles.tabText, active && styles.tabTextActive]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "stretch",
      gap: spacing.sm,
      marginBottom: spacing.lg,
      width: "100%",
    },
    tab: {
      flex: 1,
      flexBasis: 0,
      minWidth: 0,
      minHeight: 40,
      maxHeight: 40,
      borderRadius: radius.lg,
      paddingHorizontal: 6,
      alignItems: "center",
      justifyContent: "center",
    },
    tabInactive: {
      backgroundColor: colors.surfaceMuted,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tabActive: {
      backgroundColor: colors.primary,
      borderWidth: 0,
      shadowColor: colors.primaryGlow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 8,
      elevation: 4,
    },
    tabText: {
      fontSize: 12,
      lineHeight: 16,
      color: colors.textMuted,
      fontWeight: "600",
      textAlign: "center",
    },
    tabTextActive: {
      color: colors.white,
      fontWeight: "700",
    },
  });
}
