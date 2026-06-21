import { Switch, StyleSheet, Text, View } from "react-native";

import { spacing, typography } from "../theme";
import { useThemedStyles, type AppColors } from "../theme";
import { useThemeColors } from "../theme/ThemeProvider";

type AppSwitchRowProps = {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

export function AppSwitchRow({ label, value, onValueChange }: AppSwitchRowProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Switch
        onValueChange={onValueChange}
        thumbColor={colors.white}
        trackColor={{ false: colors.surfaceMuted, true: colors.primary }}
        value={value}
      />
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  label: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    paddingRight: spacing.md,
  },
});
}
