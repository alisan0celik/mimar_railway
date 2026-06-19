import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { USER_GUIDE_SECTION_IDS } from "../data/faqContent";
import { useTranslation } from "../../../shared/i18n";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { DesignBackHeader, Screen } from "../../../shared/ui";

export function UserGuideScreen() {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();

  const sections = useMemo(
    () =>
      USER_GUIDE_SECTION_IDS.map((id) => ({
        id,
        title: t(`support.guide.sections.${id}.title`),
        steps: t(`support.guide.sections.${id}.steps`).split("|"),
      })),
    [t],
  );

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <DesignBackHeader title={t("support.manual")} />

      {sections.map((section) => (
        <View key={section.id} style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons color={colors.primary} name="book-open-outline" size={20} />
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
          {section.steps.map((step, index) => (
            <View key={`${section.id}-${index}`} style={styles.stepRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step.trim()}</Text>
            </View>
          ))}
        </View>
      ))}
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    content: { paddingBottom: 100 },
    section: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      marginBottom: spacing.md,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    sectionTitle: {
      ...typography.body,
      color: colors.text,
      fontWeight: "700",
      flex: 1,
    },
    stepRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.md,
      marginBottom: spacing.sm,
    },
    stepBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    stepBadgeText: {
      ...typography.caption,
      color: colors.primary,
      fontWeight: "700",
    },
    stepText: {
      ...typography.bodySmall,
      color: colors.textSoft,
      flex: 1,
      lineHeight: 20,
    },
  });
}
