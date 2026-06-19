import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { radius, spacing, typography } from "../theme";
import { useThemedStyles, type AppColors } from "../theme";
import { useThemeColors } from "../theme/ThemeProvider";

type DesignSelectFieldProps = {
  label: string;
  value: string;
  onPress?: () => void;
};

export function DesignSelectField({ label, value, onPress }: DesignSelectFieldProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable onPress={onPress} style={styles.field}>
        <Text style={styles.value}>{value}</Text>
        <MaterialCommunityIcons color={colors.textMuted} name="chevron-down" size={22} />
      </Pressable>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    fontWeight: "600",
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  value: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
});
}
