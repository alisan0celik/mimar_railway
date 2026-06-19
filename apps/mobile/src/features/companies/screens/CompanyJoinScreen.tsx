import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { getPostAuthRoute } from "../../auth/utils/post-auth-route";
import { companiesApi } from "../../../services/api/companies.api";
import { setTokens } from "../../../services/auth/token-storage";
import { useTranslation } from "../../../shared/i18n";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { useAuthStore } from "../../../store/authStore";
import { AppButton, AppInput, Screen, ScreenHeader } from "../../../shared/ui";

export function CompanyJoinScreen() {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const router = useRouter();
  const { t } = useTranslation();
  const setUser = useAuthStore((s) => s.setUser);
  const params = useLocalSearchParams<{ companyId?: string; companyName?: string }>();
  const companyId = params.companyId ?? "";
  const companyName = params.companyName ?? "";
  const [inviteCode, setInviteCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submitJoinRequest = async () => {
    if (!companyId) {
      Alert.alert(t("common.error"), t("companies.alerts.notSelected"));
      return;
    }

    setLoading(true);
    try {
      const response = await companiesApi.requestJoin(companyId, { message: message.trim() || undefined });
      const { accessToken, refreshToken, user } = response.data;

      if (accessToken && refreshToken) {
        await setTokens(accessToken, refreshToken);
      }
      if (user) {
        setUser(user);
        router.replace(getPostAuthRoute(user));
        return;
      }

      router.replace("/(main)/companies/pending");
    } catch (error: any) {
      const msg = error?.response?.data?.message || t("companies.alerts.joinFailed");
      Alert.alert(t("common.error"), msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <ScreenHeader title={t("companies.joinForm.title")} />

      {companyName ? (
        <View style={styles.companyInfoCard}>
          <View style={styles.companyIconWrap}>
            <MaterialCommunityIcons name="office-building" size={32} color={colors.primary} />
          </View>
          <Text style={styles.companyName}>{companyName}</Text>
          <Text style={styles.companyDesc}>{t("companies.joinForm.requestDesc")}</Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="key-variant" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>{t("companies.joinForm.inviteSectionTitle")}</Text>
        </View>
        <View style={styles.formCard}>
          <AppInput
            label={t("companies.joinForm.inviteCode")}
            onChangeText={setInviteCode}
            placeholder={t("companies.joinForm.inviteCodePlaceholder")}
            value={inviteCode}
          />
          <AppButton
            fullWidth
            disabled
            onPress={() => Alert.alert(t("common.soon"), t("companies.joinForm.inviteSoon"))}
            title={t("companies.joinForm.joinWithCode")}
            style={styles.formBtn}
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="send-outline" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>{t("companies.joinForm.sendRequestSectionTitle")}</Text>
        </View>
        <View style={styles.formCard}>
          <AppInput
            label={t("companies.joinForm.message")}
            multiline
            onChangeText={setMessage}
            placeholder={t("companies.joinForm.messagePlaceholder")}
            value={message}
          />
          <AppButton
            fullWidth
            loading={loading}
            onPress={submitJoinRequest}
            title={t("companies.joinForm.sendRequest")}
            variant="secondary"
            style={styles.formBtn}
          />
        </View>
      </View>

      <View style={styles.infoNote}>
        <MaterialCommunityIcons name="information-outline" size={18} color={colors.textMuted} />
        <Text style={styles.infoText}>{t("companies.joinForm.infoNote")}</Text>
      </View>
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    content: { paddingBottom: spacing.xxl },
    companyInfoCard: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.primary,
      padding: spacing.xl,
      alignItems: "center",
      marginBottom: spacing.xl,
    },
    companyIconWrap: {
      width: 72,
      height: 72,
      borderRadius: radius.lg,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.md,
    },
    companyName: {
      ...typography.sectionTitle,
      color: colors.text,
      fontSize: 18,
    },
    companyDesc: {
      ...typography.bodySmall,
      color: colors.textMuted,
      marginTop: spacing.xs,
    },
    section: { marginBottom: spacing.xl },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    sectionTitle: {
      ...typography.sectionTitle,
      color: colors.text,
      fontSize: 16,
    },
    formCard: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
    },
    formBtn: { marginTop: spacing.md },
    infoNote: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm,
      backgroundColor: colors.cardSoft,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    infoText: {
      ...typography.caption,
      color: colors.textMuted,
      flex: 1,
      lineHeight: 18,
    },
  });
}
