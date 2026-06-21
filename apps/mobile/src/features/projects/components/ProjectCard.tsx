import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { ProjectDTO } from "../../../services/api/project.api";
import { useTranslation } from "../../../shared/i18n";
import { spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";

type ProjectCardProps = {
  project: ProjectDTO;
  onPress: () => void;
  onMenuPress?: () => void;
  showMenu?: boolean;
};

export function ProjectCard({ project, onPress, onMenuPress, showMenu }: ProjectCardProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();

  return (
    <View style={styles.card}>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.inner, pressed && styles.pressed]}>
        <View style={styles.accent} />

        <View style={styles.body}>
          <Text numberOfLines={1} style={styles.name}>
            {project.name}
          </Text>
          <Text numberOfLines={1} style={styles.client}>
            {project.customerName}
          </Text>
          {project.hasInspection ? (
            <Text numberOfLines={1} style={styles.inspection}>
              {t("projects.inspection.supervisorCompany")}:{" "}
              {project.inspectionCompany || t("common.notSpecified")}
            </Text>
          ) : null}
        </View>
      </Pressable>

      {showMenu ? (
        <Pressable
          accessibilityLabel={t("projects.menuA11y.open")}
          accessibilityRole="button"
          hitSlop={8}
          onPress={onMenuPress}
          style={({ pressed }) => [styles.menuBtn, pressed && styles.menuPressed]}
        >
          <MaterialCommunityIcons color={colors.textMuted} name="dots-vertical" size={20} />
        </Pressable>
      ) : (
        <View style={styles.menuBtn}>
          <MaterialCommunityIcons color={colors.textMuted} name="chevron-right" size={18} />
        </View>
      )}
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.projectCard,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: `${colors.primary}22`,
      marginBottom: spacing.sm,
      overflow: "hidden",
    },
    inner: {
      flex: 1,
      flexDirection: "row",
    },
    pressed: { opacity: 0.92 },
    accent: {
      width: 4,
      alignSelf: "stretch",
      backgroundColor: colors.primary,
      opacity: 0.5,
    },
    body: {
      flex: 1,
      paddingVertical: spacing.md,
      paddingLeft: spacing.md,
      paddingRight: spacing.sm,
    },
    name: {
      fontSize: 15,
      lineHeight: 21,
      color: colors.text,
      fontWeight: "700",
    },
    client: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: spacing.xs,
    },
    inspection: {
      ...typography.caption,
      color: colors.text,
      marginTop: spacing.xs,
      fontWeight: "700",
    },
    menuBtn: {
      width: 44,
      alignSelf: "stretch",
      alignItems: "center",
      justifyContent: "center",
      paddingRight: spacing.sm,
      zIndex: 2,
    },
    menuPressed: { opacity: 0.7 },
  });
}
