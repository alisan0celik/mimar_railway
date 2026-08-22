import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";

import { getApiErrorMessage, type CompanyLogoAsset } from "../utils/company-form";
import { companiesApi } from "../../../services/api";
import { useTranslation } from "../../../shared/i18n";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { resolveApiAssetUrl } from "../../../shared/utils";
import {
  AppButton,
  ConfirmDialog,
  DesignBackHeader,
  NoPermissionState,
  Screen,
} from "../../../shared/ui";
import { PERMISSIONS, useCan } from "../../../shared/permissions";
import { useAuthStore } from "../../../store/authStore";

export function CompanyLogoScreen() {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();
  const companyId = useAuthStore((s) => s.user?.companyId);
  const companyName = useAuthStore((s) => s.user?.companyName);
  const canEditCompany = useCan(PERMISSIONS.COMPANY_UPDATE);

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [initials, setInitials] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  // Yerli Alert kutuları uygulamanın dışından gelmiş gibi duruyordu;
  // bilgilendirme ve onaylar uygulamanın kendi diyaloguyla veriliyor.
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null);
  const [removeOpen, setRemoveOpen] = useState(false);

  const loadCompany = useCallback(async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await companiesApi.getById(companyId);
      setLogoUrl(data.logoUrl ?? null);
      setInitials(data.logoInitials ?? data.name.slice(0, 2).toUpperCase());
    } catch {
      setLogoUrl(null);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useFocusEffect(
    useCallback(() => {
      loadCompany();
    }, [loadCompany]),
  );

  const pickAndUpload = async () => {
    if (!companyId) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setNotice({
        title: t("companies.alerts.permissionRequired"),
        message: t("companies.alerts.galleryPermission"),
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
      setNotice({
        title: t("companies.alerts.fileTooLarge"),
        message: t("companies.alerts.logoMaxSize"),
      });
      return;
    }

    const logoAsset: CompanyLogoAsset = {
      uri: asset.uri,
      mimeType: asset.mimeType,
      fileName: asset.fileName,
    };

    setUploading(true);
    try {
      const { data } = await companiesApi.uploadLogo(companyId, logoAsset);
      setLogoUrl(data.logoUrl ?? null);
      setNotice({ title: t("common.success"), message: t("companies.logo.updated") });
    } catch (error) {
      setNotice({
        title: t("companies.alerts.logoUploadFailed"),
        message: getApiErrorMessage(error, t("companies.alerts.logoUploadFailedDesc")),
      });
    } finally {
      setUploading(false);
    }
  };

  const confirmRemove = () => {
    if (!companyId) return;
    setRemoveOpen(true);
  };

  const handleRemove = async () => {
    if (!companyId) return;
    setRemoveOpen(false);
    setUploading(true);
    try {
      await companiesApi.removeLogo(companyId);
      setLogoUrl(null);
      setNotice({ title: t("common.success"), message: t("companies.logo.removed") });
    } catch (error) {
      setNotice({
        title: t("common.error"),
        message: getApiErrorMessage(error, t("companies.alerts.logoUploadFailedDesc")),
      });
    } finally {
      setUploading(false);
    }
  };

  if (!canEditCompany) {
    return (
      <Screen>
        <DesignBackHeader
          fallbackRoute="/(main)/(tabs)/profile"
          title={t("companies.logo.title")}
        />
        <NoPermissionState
          description={t("companies.logo.noPermission")}
          title={t("companies.logo.title")}
        />
      </Screen>
    );
  }

  const resolvedUrl = logoUrl ? resolveApiAssetUrl(logoUrl) : null;

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <DesignBackHeader
        fallbackRoute="/(main)/(tabs)/profile"
        title={t("companies.logo.title")}
      />

      <View style={styles.card}>
        {loading ? (
          <ActivityIndicator color={colors.primary} size="large" style={styles.loader} />
        ) : (
          <>
            {resolvedUrl ? (
              <Image source={{ uri: resolvedUrl }} style={styles.logo} />
            ) : (
              <View style={[styles.logo, styles.logoPlaceholder]}>
                <Text style={styles.logoInitials}>{initials ?? "?"}</Text>
              </View>
            )}

            <Text style={styles.companyName}>{companyName ?? "—"}</Text>
            <Text style={styles.hint}>{t("companies.logo.hint")}</Text>

            <AppButton
              fullWidth
              loading={uploading}
              onPress={pickAndUpload}
              style={styles.button}
              title={resolvedUrl ? t("companies.logo.change") : t("companies.logo.add")}
            />

            {resolvedUrl ? (
              <Pressable disabled={uploading} onPress={confirmRemove} style={styles.removeBtn}>
                <Text style={styles.removeText}>{t("companies.logo.remove")}</Text>
              </Pressable>
            ) : null}

            <View style={styles.noteRow}>
              <MaterialCommunityIcons color={colors.textMuted} name="information-outline" size={16} />
              <Text style={styles.note}>{t("companies.logo.note")}</Text>
            </View>
          </>
        )}
      </View>

      <ConfirmDialog
        confirmDestructive
        confirmLabel={t("common.delete")}
        loading={uploading}
        message={t("companies.logo.removeConfirm")}
        onCancel={() => setRemoveOpen(false)}
        onConfirm={handleRemove}
        title={t("companies.logo.removeTitle")}
        visible={removeOpen}
      />

      <ConfirmDialog
        confirmLabel={t("common.ok")}
        message={notice?.message ?? ""}
        onCancel={() => setNotice(null)}
        onConfirm={() => setNotice(null)}
        singleAction
        title={notice?.title ?? ""}
        visible={notice !== null}
      />
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    content: { paddingBottom: spacing.xxl },
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.xl,
      alignItems: "center",
      marginTop: spacing.md,
    },
    loader: { marginVertical: spacing.xxl },
    logo: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.cardSoft,
    },
    logoPlaceholder: { alignItems: "center", justifyContent: "center" },
    logoInitials: { fontSize: 40, fontWeight: "700", color: colors.primary },
    companyName: {
      ...typography.h3,
      color: colors.text,
      marginTop: spacing.md,
      textAlign: "center",
    },
    hint: {
      ...typography.bodySmall,
      color: colors.textMuted,
      textAlign: "center",
      marginTop: spacing.xs,
    },
    button: { marginTop: spacing.lg },
    removeBtn: { marginTop: spacing.md, paddingVertical: spacing.xs },
    removeText: {
      ...typography.bodySmall,
      color: colors.danger,
      fontWeight: "600",
      textDecorationLine: "underline",
    },
    noteRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      marginTop: spacing.md,
    },
    note: { ...typography.caption, color: colors.textMuted, flex: 1 },
  });
}
