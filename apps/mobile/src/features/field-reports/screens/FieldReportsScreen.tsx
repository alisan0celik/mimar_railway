import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { fetchWithReadCache } from "../../../offline/cache/read-cache";
import {
  discardPendingFieldReport,
  flushPendingFieldReports,
  type PendingFieldReport,
  retryPendingFieldReport,
  subscribeFieldReportQueue,
  usePendingFieldReports,
} from "../../../offline/field-reports/pending-field-reports";
import { getAccessToken } from "../../../services/auth/token-storage";
import { type FieldReportDTO, fieldReportsApi } from "../../../services/api/fieldReports.api";
import { useTranslation } from "../../../shared/i18n";
import { PERMISSIONS, useCan } from "../../../shared/permissions";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { ConfirmDialog, DesignBackHeader, Screen, showAppAlert } from "../../../shared/ui";
import { useAuthStore } from "../../../store/authStore";
import { useProjectStore } from "../../../store/projectStore";
import { PhotoViewer } from "../components/PhotoViewer";
import { ReportPhoto, type ReportPhotoSource } from "../components/ReportPhoto";
import { formatCoordinates, mapsUrl } from "../../../shared/location";
import { formatReportTime } from "../utils/format";

type ConfirmState =
  | { kind: "discard"; clientId: string }
  | { kind: "delete"; reportId: string }
  | null;

/**
 * Projenin saha raporları. Gönderilmeyi bekleyenler üstte, durumlarıyla;
 * gönderilenler altta, en yeni başta. Liste çevrimdışında son halinden
 * gösterilir.
 */
export function FieldReportsScreen() {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ projectId?: string }>();
  const projectId = params.projectId ?? "";
  const project = useProjectStore((state) => state.projects.find((item) => item.id === projectId));
  const userId = useAuthStore((state) => state.user?.id);
  const canUpdateProject = useCan(PERMISSIONS.PROJECT_UPDATE);

  const pending = usePendingFieldReports(projectId);
  const [reports, setReports] = useState<FieldReportDTO[] | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [viewer, setViewer] = useState<{ photos: ReportPhotoSource[]; index: number } | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  /** Kuyruktan gelen yenilemeler sessiz: bağlantı yokken her seferinde uyarı açılmasın. */
  const load = useCallback(async (silent = false) => {
    try {
      const list = await fetchWithReadCache(`field-reports:${projectId}`, () =>
        fieldReportsApi.list(projectId),
      );
      setReports(list);
      // Liste isteği gerekirse oturumu yeniledi; fotoğraflar güncel anahtarla istenir.
      setToken(await getAccessToken());
    } catch {
      setReports((current) => current ?? []);
      if (!silent) showAppAlert(t("common.error"), t("fieldReports.loadFailed"));
    }
  }, [projectId, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
      void flushPendingFieldReports();
    }, [load]),
  );

  // Bekleyen bir rapor gönderilince listede sunucudaki haliyle görünsün.
  useEffect(() => subscribeFieldReportQueue(() => void load(true)), [load]);

  const serverPhotos = (report: FieldReportDTO): ReportPhotoSource[] =>
    report.photos.map((photo) => ({
      uri: fieldReportsApi.photoUrl(projectId, report.id, photo.id),
      authenticated: true,
    }));

  const localPhotos = (report: PendingFieldReport): ReportPhotoSource[] =>
    report.photos.map((photo) => ({ uri: photo.uri, authenticated: false }));

  const handleConfirm = async () => {
    const current = confirm;
    setConfirm(null);
    if (!current) return;
    if (current.kind === "discard") {
      await discardPendingFieldReport(current.clientId);
      return;
    }
    try {
      await fieldReportsApi.remove(projectId, current.reportId);
      setReports((list) => list?.filter((report) => report.id !== current.reportId) ?? list);
    } catch {
      showAppAlert(t("common.error"), t("fieldReports.deleteFailed"));
    }
  };

  const renderPhotos = (photos: ReportPhotoSource[]) =>
    photos.length > 0 ? (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoRow}>
        {photos.map((photo, index) => (
          <Pressable key={photo.uri} onPress={() => setViewer({ photos, index })}>
            <ReportPhoto source={photo} style={styles.thumb} token={token} />
          </Pressable>
        ))}
      </ScrollView>
    ) : null;

  const renderLocation = (latitude?: number | null, longitude?: number | null) =>
    latitude != null && longitude != null ? (
      <Pressable
        onPress={() => void Linking.openURL(mapsUrl(latitude, longitude))}
        style={styles.locationRow}
      >
        <MaterialCommunityIcons color={colors.primary} name="map-marker-outline" size={16} />
        <Text style={styles.locationText}>{formatCoordinates(latitude, longitude)}</Text>
        <Text style={styles.locationLink}>{t("fieldReports.openInMaps")}</Text>
      </Pressable>
    ) : null;

  const isEmpty = reports !== null && reports.length === 0 && pending.length === 0;

  return (
    <View style={styles.wrapper}>
      <Screen contentContainerStyle={styles.content} scroll>
        <DesignBackHeader subtitle={project?.name} title={t("fieldReports.title")} />

        {pending.map((report) => (
          <View key={report.clientId} style={[styles.card, styles.pendingCard]}>
            <View style={styles.cardHeader}>
              <Text style={styles.time}>{formatReportTime(report.input.observedAt, t)}</Text>
              <View
                style={[
                  styles.statusChip,
                  report.status === "failed" ? styles.statusFailed : styles.statusPending,
                ]}
              >
                <MaterialCommunityIcons
                  color={report.status === "failed" ? colors.danger : colors.warning}
                  name={report.status === "failed" ? "alert-circle-outline" : "cloud-upload-outline"}
                  size={14}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: report.status === "failed" ? colors.danger : colors.warning },
                  ]}
                >
                  {report.status === "failed"
                    ? t("fieldReports.failed", { reason: report.lastError ?? "" })
                    : t("fieldReports.pending")}
                </Text>
              </View>
            </View>
            {report.input.title ? <Text style={styles.title}>{report.input.title}</Text> : null}
            <Text style={styles.note}>{report.input.note}</Text>
            {renderLocation(report.input.latitude, report.input.longitude)}
            {renderPhotos(localPhotos(report))}
            {report.status === "pending" ? (
              <Text style={styles.hint}>{t("fieldReports.pendingHint")}</Text>
            ) : (
              <View style={styles.actions}>
                <Pressable onPress={() => void retryPendingFieldReport(report.clientId)} style={styles.linkBtn}>
                  <MaterialCommunityIcons color={colors.primary} name="refresh" size={16} />
                  <Text style={styles.linkText}>{t("fieldReports.retry")}</Text>
                </Pressable>
                <Pressable
                  onPress={() => setConfirm({ kind: "discard", clientId: report.clientId })}
                  style={styles.linkBtn}
                >
                  <MaterialCommunityIcons color={colors.danger} name="trash-can-outline" size={16} />
                  <Text style={[styles.linkText, { color: colors.danger }]}>{t("fieldReports.discard")}</Text>
                </Pressable>
              </View>
            )}
          </View>
        ))}

        {(reports ?? []).map((report) => {
          const canDelete = report.authorId === userId || canUpdateProject;
          return (
            <View key={report.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.headerText}>
                  <Text style={styles.time}>{formatReportTime(report.observedAt, t)}</Text>
                  <Text style={styles.author}>{report.author.fullName}</Text>
                </View>
                {canDelete ? (
                  <Pressable
                    accessibilityLabel={t("common.delete")}
                    hitSlop={8}
                    onPress={() => setConfirm({ kind: "delete", reportId: report.id })}
                  >
                    <MaterialCommunityIcons color={colors.textMuted} name="trash-can-outline" size={18} />
                  </Pressable>
                ) : null}
              </View>
              {report.title ? <Text style={styles.title}>{report.title}</Text> : null}
              <Text style={styles.note}>{report.note}</Text>
              {renderLocation(report.latitude, report.longitude)}
              {renderPhotos(serverPhotos(report))}
            </View>
          );
        })}

        {isEmpty ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons color={colors.textMuted} name="camera-marker-outline" size={40} />
            <Text style={styles.emptyText}>{t("fieldReports.empty")}</Text>
          </View>
        ) : null}
      </Screen>

      <Pressable
        accessibilityLabel={t("fieldReports.add")}
        onPress={() =>
          router.push({
            pathname: "/(main)/projects/[projectId]/field-reports/new",
            params: { projectId },
          })
        }
        style={styles.fab}
      >
        <MaterialCommunityIcons color={colors.white} name="plus" size={26} />
      </Pressable>

      <PhotoViewer
        onClose={() => setViewer(null)}
        photos={viewer?.photos ?? []}
        startIndex={viewer ? viewer.index : null}
        token={token}
      />

      <ConfirmDialog
        confirmDestructive
        confirmLabel={t("common.delete")}
        message={
          confirm?.kind === "discard" ? t("fieldReports.discardMessage") : t("fieldReports.deleteMessage")
        }
        onCancel={() => setConfirm(null)}
        onConfirm={() => void handleConfirm()}
        title={confirm?.kind === "discard" ? t("fieldReports.discardTitle") : t("fieldReports.deleteTitle")}
        visible={confirm !== null}
      />
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    wrapper: { flex: 1 },
    content: { paddingBottom: 120, gap: spacing.md },
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    pendingCard: { borderStyle: "dashed", borderColor: colors.warning },
    cardHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.sm },
    headerText: { flex: 1 },
    time: { ...typography.caption, color: colors.textMuted, fontWeight: "600" },
    author: { ...typography.caption, color: colors.textSoft, marginTop: 2 },
    title: { ...typography.body, color: colors.text, fontWeight: "700" },
    note: { ...typography.bodySmall, color: colors.text, lineHeight: 20 },
    hint: { ...typography.caption, color: colors.textMuted },
    statusChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.full,
      flexShrink: 1,
    },
    statusPending: { backgroundColor: colors.warningSoft },
    statusFailed: { backgroundColor: colors.dangerSoft },
    statusText: { ...typography.caption, fontWeight: "700", flexShrink: 1 },
    locationRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
    locationText: { ...typography.caption, color: colors.textSoft },
    locationLink: { ...typography.caption, color: colors.primary, fontWeight: "700" },
    photoRow: { marginTop: spacing.xs },
    thumb: { width: 76, height: 76, borderRadius: radius.md, marginRight: spacing.sm },
    actions: { flexDirection: "row", gap: spacing.lg },
    linkBtn: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
    linkText: { ...typography.caption, color: colors.primary, fontWeight: "700" },
    emptyState: { alignItems: "center", paddingVertical: spacing.xxl, gap: spacing.md },
    emptyText: { ...typography.body, color: colors.textMuted, textAlign: "center" },
    fab: {
      position: "absolute",
      bottom: 32,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 8,
    },
  });
}
