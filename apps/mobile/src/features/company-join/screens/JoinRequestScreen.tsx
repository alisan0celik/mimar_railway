import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useTranslation } from "../../../shared/i18n";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { AppButton, Screen } from "../../../shared/ui";
import { companiesApi } from "../../../services/api";
import { setTokens } from "../../../services/auth/token-storage";
import { useAuthStore } from "../../../store/authStore";

function pickFirst(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export function JoinRequestScreen() {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    companyId?: string;
    companyName?: string;
  }>();
  const companyId = pickFirst(params.companyId);
  const companyName = pickFirst(params.companyName) || t("companies.joinRequest.selectedCompany");
  const setUser = useAuthStore((s) => s.setUser);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  return (
    <Screen contentContainerStyle={styles.content} scroll>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <MaterialCommunityIcons color={colors.text} name="arrow-left" size={24} />
      </Pressable>

      <Text style={styles.pageTitle}>{t("companies.joinRequest.title")}</Text>

      <View style={styles.illustrationWrap}>
        <LinearGradient
          colors={["rgba(124,124,248,0.35)", "rgba(99,102,241,0.08)"]}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={styles.illustrationGlow}
        />
        <MaterialCommunityIcons
          color={colors.primaryLight}
          name="send"
          size={80}
          style={styles.planeIcon}
        />
      </View>

      <Text style={styles.companyDescription}>
        {t("companies.joinRequest.descriptionPrefix")}
        <Text style={styles.companyName}>{companyName}</Text>
        {t("companies.joinRequest.descriptionSuffix")}
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t("companies.joinRequest.messageOptional")}</Text>
        <View style={[styles.textAreaWrapper, { borderColor: colors.inputBorder }]}>
          <TextInput
            multiline
            numberOfLines={5}
            onChangeText={setMessage}
            placeholder={t("companies.joinRequest.messagePlaceholder")}
            placeholderTextColor={colors.textDisabled}
            style={[styles.textArea, { color: colors.text }]}
            textAlignVertical="top"
            value={message}
          />
        </View>
      </View>

      <AppButton
        fullWidth
        loading={sending}
        onPress={async () => {
          if (!companyId) return;
          setSending(true);
          try {
            const response = await companiesApi.requestJoin(companyId, { message: message || undefined });
            const { accessToken, refreshToken, user } = response.data;
            if (accessToken && refreshToken) {
              await setTokens(accessToken, refreshToken);
            }
            if (user) {
              setUser(user);
            }
            router.replace({
              pathname: "/(auth)/approval-pending",
              params: { companyName, submittedAt: new Date().toISOString() },
            });
          } catch {
            Alert.alert(t("common.error"), t("companies.alerts.requestFailed"));
          } finally {
            setSending(false);
          }
        }}
        size="lg"
        style={styles.submitBtn}
        title={t("companies.joinForm.sendRequest")}
      />

      <Pressable onPress={() => {}} style={styles.inviteLink}>
        <Text style={styles.inviteLinkText}>
          {t("companies.joinRequest.invitePrompt")}
          <Text style={styles.inviteLinkHighlight}>{t("companies.joinRequest.inviteLink")}</Text>
        </Text>
      </Pressable>
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    content: { paddingBottom: spacing.xxl },
    backButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.md,
    },
    pageTitle: {
      fontSize: 26,
      fontWeight: "700",
      color: colors.text,
      marginBottom: spacing.xl,
    },
    illustrationWrap: {
      alignSelf: "center",
      width: 160,
      height: 160,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.xl,
    },
    illustrationGlow: {
      position: "absolute",
      width: 160,
      height: 160,
      borderRadius: 80,
    },
    planeIcon: {
      transform: [{ rotate: "-30deg" }],
    },
    companyDescription: {
      ...typography.body,
      color: colors.textMuted,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: spacing.xl,
    },
    companyName: {
      color: colors.text,
      fontWeight: "700",
    },
    inputGroup: {
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    inputLabel: {
      ...typography.bodySmall,
      color: colors.textSoft,
      fontWeight: "600",
    },
    textAreaWrapper: {
      backgroundColor: colors.input,
      borderWidth: 1,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      minHeight: 110,
    },
    textArea: {
      fontSize: 14,
      lineHeight: 20,
      flex: 1,
      minHeight: 90,
    },
    submitBtn: { marginBottom: spacing.lg },
    inviteLink: {
      alignItems: "center",
      paddingVertical: spacing.sm,
    },
    inviteLinkText: {
      ...typography.bodySmall,
      color: colors.textMuted,
    },
    inviteLinkHighlight: {
      color: colors.primaryLight,
      fontWeight: "700",
    },
  });
}
