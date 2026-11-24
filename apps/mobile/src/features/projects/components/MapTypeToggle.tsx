import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text } from "react-native";

import { useTranslation } from "../../../shared/i18n";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";

export type ProjectMapType = "standard" | "hybrid";

/** Haritanın sağ üstündeki düğme: sokak haritası ile uydu görüntüsü arasında geçiş. */
export function MapTypeToggle({
  value,
  onChange,
}: {
  value: ProjectMapType;
  onChange: (value: ProjectMapType) => void;
}) {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();
  const satellite = value === "hybrid";

  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={6}
      onPress={() => onChange(satellite ? "standard" : "hybrid")}
      style={styles.button}
    >
      <MaterialCommunityIcons
        color={colors.text}
        name={satellite ? "map-outline" : "satellite-variant"}
        size={16}
      />
      <Text style={styles.label}>{satellite ? t("projects.map.standard") : t("projects.map.satellite")}</Text>
    </Pressable>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    button: {
      position: "absolute",
      top: spacing.sm,
      right: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radius.full,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    label: { ...typography.caption, color: colors.text, fontWeight: "700" },
  });
}
