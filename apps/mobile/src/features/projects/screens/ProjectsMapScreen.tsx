import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import type { ProjectDTO } from "../../../services/api/project.api";
import { useTranslation } from "../../../shared/i18n";
import { directionsUrl, MAPS_AVAILABLE, type GeoPoint } from "../../../shared/location";
import { PERMISSIONS, useCan } from "../../../shared/permissions";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { AppButton, DesignBackHeader, EmptyState, Screen } from "../../../shared/ui";
import { useProjectStore } from "../../../store/projectStore";
import { DeadlineBadge } from "../components/DeadlineBadge";
import { ProjectsMapView, type ProjectPin } from "../components/ProjectsMapView";
import { deadlineStatus, type DeadlineStatus } from "../utils/contractDeadline";
import {
  compareByUrgency,
  DEADLINE_MARKER_COLORS,
  DEADLINE_ORDER,
  formatParcel,
  projectPoint,
} from "../utils/projectMap";

const ONGOING_STATUSES = ["active", "planning", "waiting"];

type Entry = { project: ProjectDTO; point: GeoPoint | null; status: DeadlineStatus };
type LocatedEntry = Entry & { point: GeoPoint };

/**
 * Belediyenin devam eden işleri haritada (belediye modu). İşaretin rengi işin
 * süre durumunu gösteriyor; konumu girilmemiş işler altta listeleniyor.
 * Harita gösterilemeyen cihazlarda (anahtarsız Android derlemesi, web) aynı
 * işler yol tarifi düğmeleriyle liste olarak görünüyor.
 */
export function ProjectsMapScreen() {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();
  const router = useRouter();
  const canEdit = useCan(PERMISSIONS.PROJECT_UPDATE);
  const { projects, fetchProjects } = useProjectStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Açılışta bir kez yenileniyor. Konum ekranında kaydedilen nokta proje
  // listesine hemen işlendiği için dönüşte yeniden çekmeye gerek yok.
  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  const entries = useMemo<Entry[]>(
    () =>
      projects
        .filter((project) => ONGOING_STATUSES.includes(project.status))
        .map((project) => ({ project, point: projectPoint(project), status: deadlineStatus(project) })),
    [projects],
  );
  const located = useMemo(
    () =>
      entries
        .filter((entry): entry is LocatedEntry => entry.point !== null)
        .sort((a, b) => compareByUrgency(a.status, b.status) || a.project.name.localeCompare(b.project.name, "tr")),
    [entries],
  );
  const unlocated = useMemo(() => entries.filter((entry) => entry.point === null), [entries]);

  const pins = useMemo<ProjectPin[]>(
    () =>
      located.map(({ project, point, status }) => ({
        id: project.id,
        latitude: point.latitude,
        longitude: point.longitude,
        color: DEADLINE_MARKER_COLORS[status.kind],
        label: project.name,
      })),
    [located],
  );
  const kinds = DEADLINE_ORDER.filter((kind) => located.some((entry) => entry.status.kind === kind));
  const selected = located.find((entry) => entry.project.id === selectedId) ?? null;

  const openProject = (projectId: string) =>
    router.push({ pathname: "/(main)/projects/[projectId]", params: { projectId } });
  const openLocation = (projectId: string) =>
    router.push({ pathname: "/(main)/projects/[projectId]/location", params: { projectId } });
  const openDirections = (point: GeoPoint) =>
    void Linking.openURL(directionsUrl(point.latitude, point.longitude));

  const renderRow = (entry: Entry, onPress: () => void) => {
    const parcel = formatParcel(entry.project, t);
    const point = entry.point;
    return (
      <Pressable
        accessibilityRole="button"
        key={entry.project.id}
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        {point ? (
          <View style={[styles.dot, { backgroundColor: DEADLINE_MARKER_COLORS[entry.status.kind] }]} />
        ) : (
          <MaterialCommunityIcons color={colors.textMuted} name="map-marker-off-outline" size={16} />
        )}
        <View style={styles.rowBody}>
          <Text numberOfLines={1} style={styles.rowTitle}>
            {entry.project.name}
          </Text>
          {entry.project.customerName ? (
            <Text numberOfLines={1} style={styles.rowMeta}>
              {entry.project.customerName}
            </Text>
          ) : null}
          {parcel ? (
            <Text numberOfLines={1} style={styles.rowMeta}>
              {parcel}
            </Text>
          ) : null}
          <DeadlineBadge status={entry.status} />
        </View>
        {point ? (
          <Pressable
            accessibilityLabel={t("projects.map.directions")}
            accessibilityRole="link"
            hitSlop={8}
            onPress={() => openDirections(point)}
            style={styles.iconButton}
          >
            <MaterialCommunityIcons color={colors.primary} name="directions" size={20} />
          </Pressable>
        ) : (
          <MaterialCommunityIcons color={colors.textMuted} name="chevron-right" size={20} />
        )}
      </Pressable>
    );
  };

  return (
    <Screen contentContainerStyle={styles.content} scroll>
      <DesignBackHeader
        subtitle={
          entries.length > 0
            ? t("projects.map.subtitle", { located: located.length, total: entries.length })
            : undefined
        }
        title={t("projects.map.title")}
      />

      {entries.length === 0 ? (
        <EmptyState description={t("projects.map.emptyDesc")} title={t("projects.map.emptyTitle")} />
      ) : null}

      {entries.length > 0 && !MAPS_AVAILABLE ? (
        <View style={styles.notice}>
          <MaterialCommunityIcons color={colors.textMuted} name="map-marker-off-outline" size={18} />
          <Text style={styles.noticeText}>{t("projects.map.mapUnavailable")}</Text>
        </View>
      ) : null}

      {entries.length > 0 && located.length === 0 ? (
        <View style={styles.notice}>
          <MaterialCommunityIcons color={colors.textMuted} name="map-marker-question-outline" size={18} />
          <Text style={styles.noticeText}>{t("projects.map.noneLocated")}</Text>
        </View>
      ) : null}

      {MAPS_AVAILABLE && located.length > 0 ? (
        <View style={styles.mapBlock}>
          <View style={styles.legend}>
            {kinds.map((kind) => (
              <View key={kind} style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: DEADLINE_MARKER_COLORS[kind] }]} />
                <Text style={styles.legendText}>{t(`projects.map.legend.${kind}`)}</Text>
              </View>
            ))}
          </View>

          <ProjectsMapView onSelect={setSelectedId} pins={pins} />

          {selected ? (
            <View style={styles.selectedCard}>
              <View style={styles.selectedHead}>
                <View style={[styles.dot, { backgroundColor: DEADLINE_MARKER_COLORS[selected.status.kind] }]} />
                <Text numberOfLines={2} style={styles.selectedTitle}>
                  {selected.project.name}
                </Text>
                <Pressable
                  accessibilityLabel={t("common.close")}
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => setSelectedId(null)}
                >
                  <MaterialCommunityIcons color={colors.textMuted} name="close" size={20} />
                </Pressable>
              </View>
              {selected.project.customerName ? (
                <Text style={styles.rowMeta}>{selected.project.customerName}</Text>
              ) : null}
              {formatParcel(selected.project, t) ? (
                <Text style={styles.rowMeta}>{formatParcel(selected.project, t)}</Text>
              ) : null}
              <DeadlineBadge status={selected.status} />
              <View style={styles.selectedActions}>
                <AppButton
                  onPress={() => openProject(selected.project.id)}
                  size="sm"
                  style={styles.selectedButton}
                  title={t("projects.map.openProject")}
                />
                <AppButton
                  leftIcon={<MaterialCommunityIcons color={colors.text} name="directions" size={16} />}
                  onPress={() => openDirections(selected.point)}
                  size="sm"
                  style={styles.selectedButton}
                  title={t("projects.map.directions")}
                  variant="secondary"
                />
              </View>
            </View>
          ) : (
            <Text style={styles.hint}>{t("projects.map.tapHint")}</Text>
          )}
        </View>
      ) : null}

      {located.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("projects.map.locatedTitle", { count: located.length })}
          </Text>
          {located.map((entry) => renderRow(entry, () => openProject(entry.project.id)))}
        </View>
      ) : null}

      {unlocated.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("projects.map.unlocatedTitle", { count: unlocated.length })}
          </Text>
          <Text style={styles.hint}>
            {canEdit ? t("projects.map.unlocatedHint") : t("projects.map.unlocatedHintReadOnly")}
          </Text>
          {unlocated.map((entry) =>
            renderRow(entry, () =>
              canEdit ? openLocation(entry.project.id) : openProject(entry.project.id),
            ),
          )}
        </View>
      ) : null}
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    content: { paddingBottom: 100, gap: spacing.md },
    notice: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceMuted,
    },
    noticeText: { ...typography.caption, color: colors.textMuted, lineHeight: 18, flex: 1 },
    mapBlock: { gap: spacing.sm },
    legend: { flexDirection: "row", flexWrap: "wrap", columnGap: spacing.md, rowGap: spacing.xs },
    legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
    legendText: { ...typography.caption, color: colors.textSoft },
    dot: { width: 10, height: 10, borderRadius: 5 },
    hint: { ...typography.caption, color: colors.textMuted, lineHeight: 18 },
    selectedCard: {
      gap: spacing.xs,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    selectedHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    selectedTitle: { ...typography.body, color: colors.text, fontWeight: "700", flex: 1 },
    selectedActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
    selectedButton: { flex: 1 },
    section: { gap: spacing.sm },
    sectionTitle: { ...typography.body, color: colors.text, fontWeight: "700" },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    pressed: { opacity: 0.7 },
    rowBody: { flex: 1, gap: 3 },
    rowTitle: { ...typography.bodySmall, color: colors.text, fontWeight: "600" },
    rowMeta: { ...typography.caption, color: colors.textMuted },
    iconButton: { padding: 4 },
  });
}
