import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Language } from "../../../shared/i18n";
import { useTranslation } from "../../../shared/i18n";
import type { AppColors } from "../../../shared/theme/colors";
import { spacing, typography } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { useThemedStyles } from "../../../shared/theme/useThemedStyles";
import { DesignBackHeader, Screen } from "../../../shared/ui";

const options: Array<{ lang: Language; icon: string; titleKey: string; descKey: string }> = [
  {
    lang: "tr",
    icon: "translate",
    titleKey: "language.turkish",
    descKey: "language.turkishDesc",
  },
  {
    lang: "en",
    icon: "alphabet-latin",
    titleKey: "language.english",
    descKey: "language.englishDesc",
  },
];

export function LanguageScreen() {
  const { t, language, setLanguage } = useTranslation();
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <DesignBackHeader title={t("language.title")} />

      <Text style={styles.hint}>{t("language.hint")}</Text>

      <View style={styles.list}>
        {options.map((option) => {
          const selected = language === option.lang;
          return (
            <Pressable
              key={option.lang}
              onPress={() => setLanguage(option.lang)}
              style={({ pressed }) => [
                styles.option,
                selected && styles.optionSelected,
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
                <MaterialCommunityIcons
                  color={selected ? colors.white : colors.textMuted}
                  name={option.icon as "translate"}
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
