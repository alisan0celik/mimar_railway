import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { projectApi, type ProjectDTO } from "../../../services/api/project.api";
import { useTranslation } from "../../../shared/i18n";
import {
  coordinateText,
  getCurrentPosition,
  LATITUDE_LIMIT,
  LONGITUDE_LIMIT,
  MAPS_AVAILABLE,
  mapsUrl,
  parseCoordinate,
  parseCoordinatePair,
  type GeoPoint,
} from "../../../shared/location";
import { PERMISSIONS, useCan } from "../../../shared/permissions";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import {
  AppButton,
  AppInput,
  DesignBackHeader,
  ErrorState,
  Screen,
  showAppAlert,
} from "../../../shared/ui";
import { useProjectStore } from "../../../store/projectStore";
import { LocationPickerMap } from "../components/LocationPickerMap";
import { pointRegion, projectPoint, regionAround } from "../utils/projectMap";

/** Sunucudaki sınırlar. */
const NEIGHBOURHOOD_MAX = 80;
const CADASTRAL_MAX = 20;

// iOS'un sayı klavyesinde eksi işareti yok; noktalama klavyesinde var.
const COORDINATE_KEYBOARD = Platform.OS === "ios" ? "numbers-and-punctuation" : "numeric";

type FormState = {
  latitude: string;
  longitude: string;
  neighbourhood: string;
  cadastralBlock: string;
  cadastralParcel: string;
};

function formFrom(project: ProjectDTO): FormState {
  const point = projectPoint(project);
  return {
    latitude: point ? coordinateText(point.latitude) : "",
    longitude: point ? coordinateText(point.longitude) : "",
    neighbourhood: project.neighbourhood ?? "",
    cadastralBlock: project.cadastralBlock ?? "",
    cadastralParcel: project.cadastralParcel ?? "",
  };
}

/**
 * İşin yeri (belediye modu): haritadaki noktası, mahallesi, adası ve parseli.
 * Nokta haritaya dokunarak, bulunulan yerden ya da koordinat yazarak seçiliyor.
 * Proje düzenleme yetkisi olmayanlar yalnızca görür.
 */
export function ProjectLocationScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ projectId?: string }>();
  const projectId = params.projectId ?? "";
  const projects = useProjectStore((state) => state.projects);
  const fromStore = projects.find((item) => item.id === projectId) ?? null;
  const [loaded, setLoaded] = useState<ProjectDTO | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const project = fromStore ?? loaded;

  // Listeden gelinmediyse (ör. bildirimden) proje sunucudan okunur.
  useEffect(() => {
    if (fromStore || loaded || !projectId) return;
    projectApi
      .getProject(projectId)
      .then(setLoaded)
      .catch(() => setLoadFailed(true));
  }, [fromStore, loaded, projectId]);

  if (!project) {
    return (
      <Screen>
        <DesignBackHeader title={t("projects.site.title")} />
        <ErrorState
          message={loadFailed ? t("projects.detail.notFound") : t("projects.detail.loading")}
          title={loadFailed ? t("states.error") : t("states.loading")}
        />
      </Screen>
    );
  }

  return <LocationForm key={project.id} project={project} />;
}

function LocationForm({ project }: { project: ProjectDTO }) {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();
  const router = useRouter();
  const canEdit = useCan(PERMISSIONS.PROJECT_UPDATE);
  const { projects, updateProject } = useProjectStore();

  const [form, setForm] = useState<FormState>(() => formFrom(project));
  const [focusRequest, setFocusRequest] = useState(0);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const typedCoordinates = useRef(false);

  // Nokta yoksa harita birimin öteki işlerine bakarak açılır; bir belediyenin
  // işleri çoğunlukla aynı ilçede. Hiçbirinde konum yoksa Türkiye görünür.
  const [initialRegion] = useState(() => {
    const own = projectPoint(project);
    if (own) return pointRegion(own);
    const others = projects
      .filter((item) => item.id !== project.id)
      .map((item) => projectPoint(item))
      .filter((point): point is GeoPoint => point !== null);
    return regionAround(others);
  });

  const latitude = parseCoordinate(form.latitude, LATITUDE_LIMIT);
  const longitude = parseCoordinate(form.longitude, LONGITUDE_LIMIT);
  const point: GeoPoint | null =
    latitude != null && longitude != null ? { latitude, longitude } : null;
  // Sunucu yarım noktayı kabul etmiyor: biri yazılıp öteki boş bırakılamaz.
  const missingHalf =
    latitude !== undefined && longitude !== undefined && (latitude === null) !== (longitude === null);
  const latitudeError =
    latitude === undefined
      ? t("projects.site.invalidLatitude")
      : missingHalf && latitude === null
        ? t("projects.site.pairRequired")
        : undefined;
  const longitudeError =
    longitude === undefined
      ? t("projects.site.invalidLongitude")
      : missingHalf && longitude === null
        ? t("projects.site.pairRequired")
        : undefined;
  const invalid = Boolean(latitudeError || longitudeError);

  const original = formFrom(project);
  const isDirty = (Object.keys(form) as (keyof FormState)[]).some(
    (key) => form[key].trim() !== original[key].trim(),
  );

  const update = (patch: Partial<FormState>) => setForm((current) => ({ ...current, ...patch }));

  const setPoint = (next: GeoPoint) =>
    update({ latitude: coordinateText(next.latitude), longitude: coordinateText(next.longitude) });

  const handleCoordinateText = (field: "latitude" | "longitude", text: string) => {
    // Google Haritalar'dan kopyalanan "38.42, 27.14" iki alana birden
    // dağıtılıyor. Yalnızca yapıştırmada bakılıyor (tek seferde birden çok
    // karakter): elle yazarken "38.42, 2" anında bölünüp kalanı enleme eklenirdi.
    const pasted = text.length - form[field].length > 1;
    const pair = pasted ? parseCoordinatePair(text) : null;
    if (pair) {
      setPoint(pair);
      setFocusRequest((count) => count + 1);
      return;
    }
    typedCoordinates.current = true;
    update(field === "latitude" ? { latitude: text } : { longitude: text });
  };

  // Elle yazılan koordinat, alandan çıkınca haritada gösteriliyor; her tuşta
  // kaydırmak haritayı oynatırdı.
  const showTypedPoint = () => {
    if (!typedCoordinates.current || !point) return;
    typedCoordinates.current = false;
    setFocusRequest((count) => count + 1);
  };

  const fillCurrentLocation = async () => {
    setLocating(true);
    const result = await getCurrentPosition("high");
    setLocating(false);
    if (result.status === "ok") {
      setPoint(result.position);
      setFocusRequest((count) => count + 1);
    } else if (result.status === "denied") {
      showAppAlert(t("common.info"), t("projects.site.locationDenied"));
    } else {
      showAppAlert(t("common.error"), t("projects.site.locationFailed"));
    }
  };

  const handleSave = async () => {
    if (invalid) return;
    setSaving(true);
    try {
      await updateProject(project.id, {
        latitude: point?.latitude ?? null,
        longitude: point?.longitude ?? null,
        neighbourhood: form.neighbourhood.trim() || null,
        cadastralBlock: form.cadastralBlock.trim() || null,
        cadastralParcel: form.cadastralParcel.trim() || null,
      });
      router.back();
    } catch {
      showAppAlert(t("common.error"), t("projects.site.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen contentContainerStyle={styles.content} scroll>
      <DesignBackHeader subtitle={project.name} title={t("projects.site.title")} />

      {!canEdit ? <Text style={styles.readOnly}>{t("projects.site.readOnly")}</Text> : null}

      <Text style={styles.sectionTitle}>{t("projects.site.sectionPoint")}</Text>
      {MAPS_AVAILABLE ? (
        <View style={styles.mapBlock}>
          <LocationPickerMap
            focusRequest={focusRequest}
            initialRegion={initialRegion}
            onChange={canEdit ? setPoint : undefined}
            point={point}
          />
          {canEdit ? <Text style={styles.hint}>{t("projects.site.mapHint")}</Text> : null}
        </View>
      ) : (
        <View style={styles.notice}>
          <MaterialCommunityIcons color={colors.textMuted} name="map-marker-off-outline" size={18} />
          <Text style={styles.noticeText}>
            {canEdit ? t("projects.site.mapUnavailable") : t("projects.site.mapUnavailableReadOnly")}
          </Text>
        </View>
      )}

      {!canEdit && !point ? <Text style={styles.hint}>{t("projects.site.noPoint")}</Text> : null}

      <View style={styles.actions}>
        {canEdit ? (
          <Pressable
            accessibilityRole="button"
            disabled={locating}
            onPress={fillCurrentLocation}
            style={styles.actionButton}
          >
            {locating ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <MaterialCommunityIcons color={colors.primary} name="crosshairs-gps" size={16} />
            )}
            <Text style={styles.actionText}>
              {locating ? t("projects.site.locating") : t("projects.site.useCurrent")}
            </Text>
          </Pressable>
        ) : null}
        {point ? (
          <Pressable
            accessibilityRole="link"
            onPress={() => void Linking.openURL(mapsUrl(point.latitude, point.longitude))}
            style={styles.actionButton}
          >
            <MaterialCommunityIcons color={colors.primary} name="open-in-new" size={16} />
            <Text style={styles.actionText}>{t("projects.site.openInMaps")}</Text>
          </Pressable>
        ) : null}
        {canEdit && point ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => update({ latitude: "", longitude: "" })}
            style={styles.actionButton}
          >
            <MaterialCommunityIcons color={colors.danger} name="map-marker-remove-outline" size={16} />
            <Text style={[styles.actionText, styles.dangerText]}>{t("projects.site.clearPoint")}</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.row}>
        <AppInput
          autoCapitalize="none"
          containerStyle={styles.rowItem}
          editable={canEdit}
          error={latitudeError}
          keyboardType={COORDINATE_KEYBOARD}
          label={t("projects.site.latitude")}
          onBlur={showTypedPoint}
          onChangeText={(text) => handleCoordinateText("latitude", text)}
          placeholder={t("projects.site.latitudePlaceholder")}
          value={form.latitude}
        />
        <AppInput
          autoCapitalize="none"
          containerStyle={styles.rowItem}
          editable={canEdit}
          error={longitudeError}
          keyboardType={COORDINATE_KEYBOARD}
          label={t("projects.site.longitude")}
          onBlur={showTypedPoint}
          onChangeText={(text) => handleCoordinateText("longitude", text)}
          placeholder={t("projects.site.longitudePlaceholder")}
          value={form.longitude}
        />
      </View>
      {canEdit ? <Text style={styles.hint}>{t("projects.site.pasteHint")}</Text> : null}

      <Text style={styles.sectionTitle}>{t("projects.site.sectionParcel")}</Text>
      <AppInput
        autoCapitalize="words"
        editable={canEdit}
        label={t("projects.site.neighbourhood")}
        maxLength={NEIGHBOURHOOD_MAX}
        onChangeText={(neighbourhood) => update({ neighbourhood })}
        placeholder={t("projects.site.neighbourhoodPlaceholder")}
        value={form.neighbourhood}
      />
      <View style={styles.row}>
        <AppInput
          autoCapitalize="none"
          containerStyle={styles.rowItem}
          editable={canEdit}
          label={t("projects.site.cadastralBlock")}
          maxLength={CADASTRAL_MAX}
          onChangeText={(cadastralBlock) => update({ cadastralBlock })}
          placeholder={t("projects.site.blockPlaceholder")}
          value={form.cadastralBlock}
        />
        <AppInput
          autoCapitalize="none"
          containerStyle={styles.rowItem}
          editable={canEdit}
          label={t("projects.site.cadastralParcel")}
          maxLength={CADASTRAL_MAX}
          onChangeText={(cadastralParcel) => update({ cadastralParcel })}
          placeholder={t("projects.site.parcelPlaceholder")}
          value={form.cadastralParcel}
        />
      </View>

      {canEdit ? (
        <AppButton
          disabled={!isDirty || invalid || saving}
          fullWidth
          loading={saving}
          onPress={handleSave}
          style={styles.saveBtn}
          title={t("common.save")}
        />
      ) : null}
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    content: { paddingBottom: 100, gap: spacing.md },
    readOnly: { ...typography.caption, color: colors.warning },
    sectionTitle: {
      ...typography.body,
      color: colors.text,
      fontWeight: "700",
      marginTop: spacing.sm,
    },
    mapBlock: { gap: spacing.sm },
    hint: { ...typography.caption, color: colors.textMuted, lineHeight: 18 },
    notice: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceMuted,
    },
    noticeText: { ...typography.caption, color: colors.textMuted, lineHeight: 18, flex: 1 },
    actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    actionText: { ...typography.caption, color: colors.text, fontWeight: "700" },
    dangerText: { color: colors.danger },
    row: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
    rowItem: { flex: 1 },
    saveBtn: { marginTop: spacing.md },
  });
}
