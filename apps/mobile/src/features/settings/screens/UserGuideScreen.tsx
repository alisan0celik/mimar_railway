import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { resetTours } from "../../guide";
import { USER_GUIDE_VIDEO_URL } from "../constants/support.constants";
import { MUNICIPALITY_ONLY_GUIDE_SECTIONS, USER_GUIDE_SECTION_IDS } from "../data/faqContent";
import { useIsMunicipality } from "../../../store/sectorStore";
import { useTranslation } from "../../../shared/i18n";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { ConfirmDialog, DesignBackHeader, Screen, showAppAlert } from "../../../shared/ui";

export function UserGuideScreen() {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();
  const router = useRouter();
  const [confirmReset, setConfirmReset] = useState(false);

  const isMunicipality = useIsMunicipality();

  const sections = useMemo(
    () =>
      USER_GUIDE_SECTION_IDS.filter(
        (id) => isMunicipality || !MUNICIPALITY_ONLY_GUIDE_SECTIONS.includes(id),
      ).map((id) => ({
        id,
        title: t(`support.guide.sections.${id}.title`),
        steps: t(`support.guide.sections.${id}.steps`).split("|"),
      })),
    [t, isMunicipality],
  );

  const handleReplay = () => {
    setConfirmReset(false);
    resetTours();
    router.replace("/(main)/(tabs)/dashboard");
  };

  const openVideoGuide = async () => {
    try {
      await Linking.openURL(USER_GUIDE_VIDEO_URL);
    } catch {
      showAppAlert(t("support.guide.videoTitle"), USER_GUIDE_VIDEO_URL);
    }
  };

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <DesignBackHeader title={t("support.manual")} />

      <Pressable onPress={openVideoGuide} style={styles.videoCard}>
        <View style={styles.videoIcon}>
          <MaterialCommunityIcons color={colors.white} name="play" size={22} />
        </View>
        <View style={styles.videoBody}>
          <Text style={styles.videoTitle}>{t("support.guide.videoTitle")}</Text>
          <Text style={styles.videoDesc}>{t("support.guide.videoDesc")}</Text>
        </View>
        <MaterialCommunityIcons color={colors.textMuted} name="open-in-new" size={20} />
      </Pressable>

      <Pressable accessibilityRole="button" onPress={() => setConfirmReset(true)} style={styles.replayCard}>
        <View style={styles.replayIcon}>
          <MaterialCommunityIcons color={colors.primary} name="restart" size={22} />
        </View>
        <View style={styles.videoBody}>
          <Text style={styles.videoTitle}>{t("guide.replay.title")}</Text>
          <Text style={styles.videoDesc}>{t("guide.replay.desc")}</Text>
        </View>
        <MaterialCommunityIcons color={colors.textMuted} name="chevron-right" size={20} />
      </Pressable>

      <ConfirmDialog
        confirmLabel={t("guide.replay.confirm")}
        message={t("guide.replay.confirmBody")}
        onCancel={() => setConfirmReset(false)}
        onConfirm={handleReplay}
        title={t("guide.replay.title")}
        visible={confirmReset}
      />

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
    videoCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      backgroundColor: colors.primarySoft,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: `${colors.primary}33`,
      padding: spacing.lg,
      marginBottom: spacing.md,
    },
    videoIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    replayCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      marginBottom: spacing.md,
    },
    replayIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    videoBody: { flex: 1 },
    videoTitle: { ...typography.body, color: colors.text, fontWeight: "700" },
    videoDesc: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: 2,
      lineHeight: 18,
    },
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
