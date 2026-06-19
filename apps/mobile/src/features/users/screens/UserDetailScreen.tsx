import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { usersApi, companiesApi, rolesApi, type RoleDTO, type UserDTO } from "../../../services/api";
import { useAuthStore } from "../../../store/authStore";
import { useLocaleCode, useTranslation } from "../../../shared/i18n";
import { PERMISSIONS, useCan } from "../../../shared/permissions";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { AppButton, DesignBackHeader, NoPermissionState, Screen } from "../../../shared/ui";
import { initials } from "../../../shared/utils/initials";

type UserDetailScreenProps = {
  userId: string;
};

function InfoBlock({ label, value }: { label: string; value: string }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.infoBlock}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function approvalStatusLabel(status: string, t: (key: string) => string): string {
  if (status === "pending") return t("status.pendingApproval");
  if (status === "rejected") return t("status.rejected");
  if (status === "approved") return t("status.approved");
  return status;
}

export function UserDetailScreen({ userId }: UserDetailScreenProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();
  const locale = useLocaleCode();
  const canApprove = useCan(PERMISSIONS.USER_APPROVE);
  const canReject = useCan(PERMISSIONS.USER_REJECT);
  const [user, setUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const formatDate = (value: string): string => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  useEffect(() => {
    usersApi
      .getById(userId)
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleApprove = () => {
    router.push({
      pathname: "/(main)/roles",
      params: { pendingUserId: userId },
    });
  };

  const handleReject = async () => {
    const companyId = user?.companyId;
    if (!user || !companyId) return;
    setActionLoading(true);
    try {
      await companiesApi.rejectMember(companyId, userId);
      Alert.alert(t("users.alerts.rejectedTitle"), t("users.alerts.rejectSuccess", { name: user.fullName }));
      router.back();
    } catch {
      Alert.alert(t("common.error"), t("users.alerts.rejectError"));
    } finally {
      setActionLoading(false);
    }
  };

  if (!canApprove && !canReject) {
    return (
      <Screen scroll={false}>
        <NoPermissionState
          actionLabel={t("states.backHome")}
          description={t("states.noPermissionDesc")}
          onRequestAccess={() => router.replace("/(main)/(tabs)/dashboard")}
          title={t("states.noPermission")}
        />
      </Screen>
    );
  }

  if (loading) {
    return (
      <Screen scroll={false}>
        <DesignBackHeader title="" />
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (!user) {
    return (
      <Screen scroll={false}>
        <NoPermissionState
          actionLabel={t("roles.backAction")}
          description={t("users.alerts.notFoundDesc")}
          onRequestAccess={() => router.back()}
          title={t("users.alerts.notFound")}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <DesignBackHeader title={t("users.reviewTitle")} />

      <View style={styles.profileHeader}>
        <View style={styles.avatarLg}>
          <Text style={styles.avatarLgText}>{initials(user.fullName)}</Text>
        </View>
        <Text style={styles.name}>{user.fullName}</Text>
        <Text style={styles.contact}>{user.email}</Text>
        <Text style={styles.contact}>{user.phone || t("common.none")}</Text>
      </View>

      <Text style={styles.sectionTitle}>{t("users.fields.requestInfo")}</Text>
      <View style={styles.infoCard}>
        <InfoBlock label={t("users.fields.company")} value={user.companyName || t("common.none")} />
        <InfoBlock label={t("users.fields.title")} value={user.title || t("common.none")} />
        <InfoBlock label={t("users.fields.status")} value={approvalStatusLabel(user.approvalStatus, t)} />
        <InfoBlock label={t("users.fields.applicationDate")} value={formatDate(user.createdAt)} />
      </View>

      <View style={styles.bottomActions}>
        {canReject ? (
          <AppButton
            disabled={actionLoading}
            fullWidth
            onPress={handleReject}
            style={styles.rejectBtn}
            title={actionLoading ? t("users.rejecting") : t("users.reject")}
            variant="danger"
          />
        ) : null}
        {canApprove && user.approvalStatus === "pending" ? (
          <AppButton
            disabled={actionLoading}
            fullWidth
            onPress={handleApprove}
            style={styles.approveBtn}
            title={t("users.approve")}
          />
        ) : null}
      </View>
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    content: { paddingBottom: spacing.xxl },
    loading: { flex: 1, alignItems: "center", justifyContent: "center" },
    profileHeader: {
      alignItems: "center",
      marginBottom: spacing.xl,
    },
    avatarLg: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: colors.primarySoft,
      borderWidth: 2,
      borderColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.md,
    },
    avatarLgText: { fontSize: 28, fontWeight: "700", color: colors.primary },
    name: { ...typography.h2, color: colors.text, fontWeight: "700" },
    contact: { ...typography.bodySmall, color: colors.textMuted, marginTop: 4 },
    sectionTitle: {
      ...typography.sectionTitle,
      color: colors.text,
      fontWeight: "700",
      marginBottom: spacing.sm,
    },
    infoCard: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      gap: spacing.md,
      marginBottom: spacing.xl,
    },
    infoBlock: { gap: 4 },
    infoLabel: { ...typography.caption, color: colors.textMuted, fontWeight: "600" },
    infoValue: { ...typography.body, color: colors.text },
    bottomActions: {
      flexDirection: "row",
      gap: spacing.md,
      alignItems: "stretch",
    },
    rejectBtn: { flex: 1 },
    approveBtn: { flex: 1 },
  });
}
