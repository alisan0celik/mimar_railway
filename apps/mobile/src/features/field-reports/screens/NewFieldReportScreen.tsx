import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";

import { enqueueFieldReport } from "../../../offline/field-reports/pending-field-reports";
import { useTranslation } from "../../../shared/i18n";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { AppButton, AppInput, DesignBackHeader, Screen, showAppAlert } from "../../../shared/ui";
import { useProjectStore } from "../../../store/projectStore";
import { formatCoordinates } from "../utils/format";

/** Sunucunun bir rapora kabul ettiği en fazla fotoğraf. */
const MAX_PHOTOS = 10;
/**
 * Fotoğraflar sıkıştırılarak alınıyor: şantiyedeki yavaş bağlantıda 12 MP'lik
 * ham fotoğraf dakikalarca sürerdi. Bu kalite denetim için yeterince net.
 */
const PHOTO_QUALITY = 0.6;
const LOCATION_TIMEOUT_MS = 15_000;

type Photo = { uri: string; mimeType: string };
type Position = { latitude: number; longitude: number; accuracy: number | null };

function toPhotos(assets: ImagePicker.ImagePickerAsset[]): Photo[] {
  return assets.map((asset) => ({ uri: asset.uri, mimeType: asset.mimeType ?? "image/jpeg" }));
}

/**
 * Saha raporu yazma. Rapor önce cihaza kaydediliyor, bağlantı varsa hemen,
 * yoksa bağlantı gelince gönderiliyor; kullanıcı beklemeden listeye döner.
 */
export function NewFieldReportScreen() {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ projectId?: string }>();
  const projectId = params.projectId ?? "";
  const project = useProjectStore((state) => state.projects.find((item) => item.id === projectId));

  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState<string | undefined>();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [position, setPosition] = useState<Position | null>(null);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);

  const remaining = MAX_PHOTOS - photos.length;

  const addPhotos = (next: Photo[]) => {
    if (next.length > remaining) {
      showAppAlert(t("common.info"), t("fieldReports.photoLimit", { max: MAX_PHOTOS }));
    }
    setPhotos((current) => [...current, ...next].slice(0, MAX_PHOTOS));
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      showAppAlert(t("common.info"), t("fieldReports.cameraDenied"));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: PHOTO_QUALITY,
    });
    if (!result.canceled) addPhotos(toPhotos(result.assets));
  };

  const pickPhotos = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAppAlert(t("common.info"), t("fieldReports.galleryDenied"));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: PHOTO_QUALITY,
    });
    if (!result.canceled) addPhotos(toPhotos(result.assets));
  };

  const addLocation = async () => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      showAppAlert(t("common.info"), t("fieldReports.locationDenied"));
      return;
    }

    setLocating(true);
    try {
      // Kapalı alanda uydu bulunamazsa istek uzun süre asılı kalabiliyor.
      const current = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), LOCATION_TIMEOUT_MS),
        ),
      ]);
      setPosition({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        accuracy: current.coords.accuracy ?? null,
      });
    } catch {
      showAppAlert(t("common.error"), t("fieldReports.locationFailed"));
    } finally {
      setLocating(false);
    }
  };

  const handleSave = async () => {
    if (!note.trim()) {
      setNoteError(t("fieldReports.noteRequired"));
      return;
    }

    setSaving(true);
    try {
      await enqueueFieldReport({
        projectId,
        title,
        note,
        latitude: position?.latitude,
        longitude: position?.longitude,
        photos,
      });
      router.back();
    } catch {
      showAppAlert(t("common.error"), t("fieldReports.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen contentContainerStyle={styles.content} scroll>
      <DesignBackHeader subtitle={project?.name} title={t("fieldReports.newTitle")} />

      <AppInput
        label={t("fieldReports.titleLabel")}
        onChangeText={setTitle}
        placeholder={t("fieldReports.titlePlaceholder")}
        value={title}
      />
      <AppInput
        error={noteError}
        label={t("fieldReports.noteLabel")}
        multiline
        onChangeText={(value) => {
          setNote(value);
          if (noteError) setNoteError(undefined);
        }}
        placeholder={t("fieldReports.notePlaceholder")}
        value={note}
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("fieldReports.photos")}</Text>
        <Text style={styles.hint}>{t("fieldReports.photosHint", { max: MAX_PHOTOS })}</Text>

        {photos.length > 0 ? (
          <View style={styles.grid}>
            {photos.map((photo, index) => (
              <View key={photo.uri} style={styles.thumbWrap}>
                <Image source={{ uri: photo.uri }} style={styles.thumb} />
                <Pressable
                  accessibilityLabel={t("fieldReports.removePhoto")}
                  hitSlop={8}
                  onPress={() => setPhotos((current) => current.filter((_, i) => i !== index))}
                  style={styles.removeBadge}
                >
                  <MaterialCommunityIcons color={colors.white} name="close" size={14} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.buttonRow}>
          <Pressable disabled={remaining <= 0} onPress={() => void takePhoto()} style={styles.outlineBtn}>
            <MaterialCommunityIcons color={colors.primary} name="camera-outline" size={18} />
            <Text style={styles.outlineText}>{t("fieldReports.takePhoto")}</Text>
          </Pressable>
          <Pressable disabled={remaining <= 0} onPress={() => void pickPhotos()} style={styles.outlineBtn}>
            <MaterialCommunityIcons color={colors.primary} name="image-multiple-outline" size={18} />
            <Text style={styles.outlineText}>{t("fieldReports.pickPhotos")}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("fieldReports.location")}</Text>
        {position ? (
          <View style={styles.locationCard}>
            <MaterialCommunityIcons color={colors.primary} name="map-marker" size={20} />
            <View style={styles.locationBody}>
              <Text style={styles.locationText}>
                {formatCoordinates(position.latitude, position.longitude)}
              </Text>
              {position.accuracy != null ? (
                <Text style={styles.hint}>
                  {t("fieldReports.accuracy", { meters: Math.round(position.accuracy) })}
                </Text>
              ) : null}
            </View>
            <Pressable hitSlop={8} onPress={() => setPosition(null)}>
              <Text style={styles.removeText}>{t("fieldReports.removeLocation")}</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable disabled={locating} onPress={() => void addLocation()} style={styles.outlineBtn}>
            {locating ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <MaterialCommunityIcons color={colors.primary} name="crosshairs-gps" size={18} />
            )}
            <Text style={styles.outlineText}>
              {locating ? t("fieldReports.locating") : t("fieldReports.addLocation")}
            </Text>
          </Pressable>
        )}
      </View>

      <AppButton
        disabled={saving || locating}
        fullWidth
        loading={saving}
        onPress={() => void handleSave()}
        style={styles.saveBtn}
        title={t("fieldReports.save")}
      />
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    content: { paddingBottom: 100, gap: spacing.md },
    section: { gap: spacing.sm },
    sectionTitle: { ...typography.label, color: colors.textSoft },
    hint: { ...typography.caption, color: colors.textMuted },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
    thumbWrap: { position: "relative" },
    thumb: { width: 88, height: 88, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
    removeBadge: {
      position: "absolute",
      top: -6,
      right: -6,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.danger,
      alignItems: "center",
      justifyContent: "center",
    },
    buttonRow: { flexDirection: "row", gap: spacing.sm },
    outlineBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      minHeight: 48,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: `${colors.primary}66`,
      paddingHorizontal: spacing.md,
    },
    outlineText: { ...typography.bodySmall, color: colors.primary, fontWeight: "700" },
    locationCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
    },
    locationBody: { flex: 1 },
    locationText: { ...typography.bodySmall, color: colors.text, fontWeight: "600" },
    removeText: { ...typography.caption, color: colors.danger, fontWeight: "700" },
    saveBtn: { marginTop: spacing.md },
  });
}
