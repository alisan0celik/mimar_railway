import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { ProjectDTO } from "../../../services/api/project.api";
import { useTranslation } from "../../../shared/i18n";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { deadlineStatus, type DeadlineStatus } from "../utils/contractDeadline";
import { projectPoint } from "../utils/projectMap";

export type MunicipalityLink = "tender" | "field-reports" | "location";

type Tone = "success" | "warning" | "danger" | "info" | "muted";
type Status = { text: string; tone: Tone };
type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

type Translate = (key: string, params?: Record<string, string | number>) => string;

function tenderStatus(status: DeadlineStatus, t: Translate): Status {
  switch (status.kind) {
    case "unknown":
      return { text: t("projects.links.notEntered"), tone: "muted" };
    case "accepted":
      return { text: t("projects.links.accepted"), tone: "info" };
    case "overdue":
      return { text: t("projects.links.daysLate", { days: status.daysLate }), tone: "danger" };
    case "dueSoon":
      return status.daysLeft === 0
        ? { text: t("projects.links.dueToday"), tone: "warning" }
        : { text: t("projects.links.daysLeft", { days: status.daysLeft }), tone: "warning" };
    default:
      return { text: t("projects.links.daysLeft", { days: status.daysLeft }), tone: "success" };
  }
}

/**
 * Belediye modunda proje detayının üstündeki üç kutu: ihale, saha raporları ve
 * konum. Her biri kısa bir durum gösteriyor. Ayrı satırlar başlık ile notlar
 * arasında ekranın yarısını kaplıyordu; yan yana tek satıra sığıyorlar.
 */
export function MunicipalityLinks({
  project,
  pendingReports,
  onOpen,
}: {
  project: ProjectDTO;
  pendingReports: number;
  onOpen: (link: MunicipalityLink) => void;
}) {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();

  const toneColor: Record<Tone, string> = {
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
    info: colors.info,
    muted: colors.textMuted,
  };

  const tiles: { link: MunicipalityLink; icon: IconName; label: string; status?: Status }[] = [
    {
      link: "tender",
      icon: "file-sign",
      label: t("projects.links.tender"),
      status: tenderStatus(deadlineStatus(project), t),
    },
    {
      link: "field-reports",
      icon: "camera-marker-outline",
      label: t("projects.links.reports"),
      status:
        pendingReports > 0
          ? { text: t("projects.links.pendingReports", { count: pendingReports }), tone: "warning" }
          : undefined,
    },
    {
      link: "location",
      icon: "map-marker-radius-outline",
      label: t("projects.links.location"),
      status: projectPoint(project)
        ? { text: t("projects.links.onMap"), tone: "success" }
        : { text: t("projects.links.notOnMap"), tone: "muted" },
    },
  ];

  return (
    <View style={styles.row}>
      {tiles.map((tile) => (
        <Pressable
          accessibilityLabel={tile.status ? `${tile.label}, ${tile.status.text}` : tile.label}
          accessibilityRole="button"
          key={tile.link}
          onPress={() => onOpen(tile.link)}
          style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
        >
          <View style={styles.head}>
            <MaterialCommunityIcons color={colors.primary} name={tile.icon} size={16} />
            <Text numberOfLines={1} style={styles.label}>
              {tile.label}
            </Text>
          </View>
          {tile.status ? (
            <Text numberOfLines={1} style={[styles.status, { color: toneColor[tile.status.tone] }]}>
              {tile.status.text}
            </Text>
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    row: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm },
    tile: {
      flex: 1,
      gap: 2,
      backgroundColor: colors.primarySoft,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: `${colors.primary}33`,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
    },
    tilePressed: { opacity: 0.7 },
    head: { flexDirection: "row", alignItems: "center", gap: 4 },
    label: { ...typography.bodySmall, color: colors.text, fontWeight: "600", flexShrink: 1 },
    status: { ...typography.caption, fontWeight: "700" },
  });
}
