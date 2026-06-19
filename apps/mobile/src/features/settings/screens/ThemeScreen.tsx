import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTranslation } from "../../../shared/i18n";
import { useAppStore } from "../../../store/appStore";
import type { AppColors, ThemeMode } from "../../../shared/theme/colors";
import { spacing, typography } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { useThemedStyles } from "../../../shared/theme/useThemedStyles";
import { DesignBackHeader, Screen } from "../../../shared/ui";

const options: Array<{ mode: ThemeMode; icon: string; titleKey: string; descKey: string }> = [
  { mode: "dark", icon: "weather-night", titleKey: "theme.dark", descKey: "theme.darkDesc" },
  { mode: "light", icon: "white-balance-sunny", titleKey: "theme.light", descKey: "theme.lightDesc" },
];

export function ThemeScreen() {
  const themeMode = useAppStore((s) => s.themeMode);
  const setThemeMode = useAppStore((s) => s.setThemeMode);
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <DesignBackHeader title={t("theme.title")} />

      <Text style={styles.hint}>{t("theme.hint")}</Text>

      <View style={styles.list}>
        {options.map((option) => {
          const selected = themeMode === option.mode;
          return (
            <Pressable
              key={option.mode}
              onPress={() => setThemeMode(option.mode)}
              style={({ pressed }) => [
                styles.option,
                selected && styles.optionSelected,
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
                <MaterialCommunityIcons
                  color={selected ? colors.white : colors.textMuted}
                  name={option.icon as "weather-night"}
                  size={24}
                />
              </View>
              <View style={styles.optionBody}>
                <Text style={styles.optionTitle}>{t(option.titleKey)}</Text>
                <Text style={styles.optionDesc}>{t(option.descKey)}</Text>
              </View>
              {selected ? (
                <MaterialCommunityIcons color={colors.primary} name="check-circle" size={24} />
              ) : (
                <View style={styles.radioEmpty} />
              )}
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    content: { paddingBottom: 100 },
    hint: {
      ...typography.bodySmall,
      color: colors.textMuted,
      marginBottom: spacing.lg,
    },
    list: { gap: spacing.md },
    option: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
    },
    optionSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    pressed: { opacity: 0.92 },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.surfaceMuted,
      alignItems: "center",
      justifyContent: "center",
    },
    iconWrapSelected: {
      backgroundColor: colors.primary,
    },
    optionBody: { flex: 1 },
    optionTitle: {
      ...typography.body,
      color: colors.text,
      fontWeight: "700",
    },
    optionDesc: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: 4,
    },
    radioEmpty: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: colors.borderStrong,
    },
  });
}
