import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";

import { getApiErrorMessage, type CompanyLogoAsset } from "../utils/company-form";
import { getPostAuthRoute } from "../../auth/utils/post-auth-route";
import { companiesApi } from "../../../services/api";
import { useTranslation } from "../../../shared/i18n";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { AppButton, AppInput, Screen, ScreenHeader } from "../../../shared/ui";
import { useAuthStore } from "../../../store/authStore";

export function CreateCompanyScreen() {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const router = useRouter();
  const { t } = useTranslation();
  const completeAuthSession = useAuthStore((s) => s.completeAuthSession);
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [logoAsset, setLogoAsset] = useState<CompanyLogoAsset | null>(null);
  const [saving, setSaving] = useState(false);

  const handlePhotoSelect = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t("companies.alerts.permissionRequired"), t("companies.alerts.galleryPermission"));
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
      Alert.alert(t("companies.alerts.fileTooLarge"), t("companies.alerts.logoMaxSize"));
      return;
    }

    setLogoAsset({
      uri: asset.uri,
      mimeType: asset.mimeType,
      fileName: asset.fileName,
    });
  };

  const handleCreate = async () => {
    if (!companyName.trim()) {
      Alert.alert(t("common.error"), t("companies.alerts.nameRequired"));
      return;
    }

    setSaving(true);
    try {
      const { data } = await companiesApi.create({
        name: companyName.trim(),
        description: description.trim() || undefined,
        city: city.trim() || undefined,
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
      });

      if (logoAsset && data.id) {
        try {
          await companiesApi.uploadLogo(data.id, logoAsset);
        } catch {
          Alert.alert(
            t("companies.alerts.logoUploadFailed"),
            t("companies.alerts.logoUploadFailedDesc"),
          );
        }
      }

      if (!data.accessToken || !data.refreshToken || !data.user) {
        throw new Error("Invalid session response");
      }

      await completeAuthSession(data.user, data.accessToken, data.refreshToken);
      router.replace(getPostAuthRoute(data.user));
    } catch (error) {
      Alert.alert(t("common.error"), getApiErrorMessage(error, t("companies.alerts.createFailed")));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <ScreenHeader
        onBack={() => router.replace("/(auth)/select-company")}
        subtitle={t("companies.createSubtitle")}
        title={t("companies.create")}
      />

      <View style={styles.formCard}>
        <View style={styles.photoSection}>
          <Pressable onPress={handlePhotoSelect} style={styles.photoWrap}>
            {logoAsset ? (
              <Image source={{ uri: logoAsset.uri }} style={styles.photoImage} />
            ) : (
              <View style={styles.photoEmpty}>
                <MaterialCommunityIcons color={colors.primary} name="camera-plus-outline" size={32} />
              </View>
            )}
            <View style={styles.editIconBadge}>
              <MaterialCommunityIcons color={colors.white} name="pencil" size={12} />
            </View>
          </Pressable>
          <View style={styles.photoInfo}>
            <Text style={styles.photoTitle}>{t("companies.createForm.logo")}</Text>
            <Text style={styles.photoSubtitle}>{t("companies.createForm.logoHint")}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.formGroup}>
          <AppInput
            label={t("companies.createForm.name")}
            leftIcon={
              <MaterialCommunityIcons
                color={colors.textMuted}
                name="office-building-outline"
                size={20}
              />
            }
            onChangeText={setCompanyName}
            placeholder={t("companies.createForm.namePlaceholder")}
            value={companyName}
          />
          <AppInput
            label={t("companies.createForm.description")}
            multiline
            onChangeText={setDescription}
            placeholder={t("companies.createForm.descriptionPlaceholder")}
            value={description}
          />
          <AppInput
            label={t("companies.createForm.city")}
            leftIcon={
              <MaterialCommunityIcons color={colors.textMuted} name="map-marker-outline" size={20} />
            }
            onChangeText={setCity}
            placeholder={t("companies.createForm.cityPlaceholder")}
            value={city}
          />
          <AppInput
            label={t("companies.createForm.address")}
            multiline
            onChangeText={setAddress}
            placeholder={t("companies.createForm.addressPlaceholder")}
            value={address}
          />
          <AppInput
            keyboardType="phone-pad"
            label={t("companies.createForm.phone")}
            leftIcon={
              <MaterialCommunityIcons color={colors.textMuted} name="phone-outline" size={20} />
            }
            onChangeText={setPhone}
            placeholder={t("companies.createForm.phonePlaceholder")}
            value={phone}
          />
        </View>

        <AppButton
          fullWidth
          loading={saving}
          onPress={handleCreate}
          style={styles.submitBtn}
          title={t("companies.createForm.submit")}
        />
      </View>
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    content: { paddingBottom: spacing.xxl },
    formCard: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.xl,
    },
    photoSection: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.lg,
      marginBottom: spacing.lg,
    },
    photoWrap: {
      position: "relative",
    },
    photoEmpty: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primarySoft,
      borderWidth: 2,
      borderColor: colors.primary,
      borderStyle: "dashed",
      alignItems: "center",
      justifyContent: "center",
    },
    photoImage: {
      width: 80,
      height: 80,
      borderRadius: 40,
    },
    editIconBadge: {
      position: "absolute",
      bottom: 0,
      right: -4,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.text,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: colors.card,
    },
    photoInfo: {
      flex: 1,
    },
    photoTitle: {
      ...typography.body,
      color: colors.text,
      fontWeight: "600",
    },
    photoSubtitle: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: 4,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginBottom: spacing.lg,
    },
    formGroup: { gap: spacing.md },
    submitBtn: { marginTop: spacing.xl },
  });
}
