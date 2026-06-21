import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { rolesApi, type RoleDetailDTO } from "../../../services/api";
import { useTranslation } from "../../../shared/i18n";
import { PERMISSIONS, PERMISSION_LABELS, useCan, type PermissionCode } from "../../../shared/permissions";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { AppButton, DesignBackHeader, NoPermissionState, Screen } from "../../../shared/ui";

type RoleDetailScreenProps = {
  roleId: string;
};

type TabKey = "general" | "permissions";

export function RoleDetailScreen({ roleId }: RoleDetailScreenProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabKey>("general");
  const canViewRoles = useCan(PERMISSIONS.ROLE_VIEW);
  const canUpdateRole = useCan(PERMISSIONS.ROLE_UPDATE);
  const [role, setRole] = useState<RoleDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    rolesApi.getById(roleId).then((res) => {
      setRole(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [roleId]);

  if (!canViewRoles) {
    return (
      <Screen scroll={false}>
        <NoPermissionState
          actionLabel={t("roles.backAction")}
          onRequestAccess={() => router.back()}
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
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </Screen>
    );
  }

  if (!role) {
    return (
      <Screen scroll={false}>
        <NoPermissionState
          actionLabel={t("roles.backAction")}
          onRequestAccess={() => router.back()}
          title={t("roles.meta.notFound")}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <DesignBackHeader title={role.name} />

      <View style={styles.tabs}>
        {(
          [
            { key: "general" as const, label: t("roles.general") },
            { key: "permissions" as const, label: t("roles.permissions") },
          ] as const
        ).map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {activeTab === "general" ? (
        <View style={styles.card}>
          <Text style={styles.desc}>{role.description || t("roles.meta.noDescription")}</Text>
          <MetaRow label={t("roles.meta.code")} value={role.code} />
          <MetaRow
            label={t("roles.meta.assignedUsers")}
            value={t("roles.meta.assignedUsersCount", { count: role.userCount })}
          />
        </View>
      ) : (
        <View style={styles.card}>
          {role.permissions.map((code: string) => (
            <View key={code} style={styles.permRow}>
              <MaterialCommunityIcons color={colors.primary} name="check-circle" size={20} />
              <Text style={styles.permText}>
                {PERMISSION_LABELS[code as PermissionCode]?.label ?? code}
              </Text>
            </View>
          ))}
        </View>
      )}

      {canUpdateRole ? (
        <AppButton
          fullWidth
          onPress={() =>
            router.push({
              pathname: "/(main)/roles/edit/[roleId]",
              params: { roleId: role.id },
            })
          }
          style={styles.editBtn}
          title={t("roles.edit")}
        />
      ) : null}
    </Screen>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  content: { paddingBottom: 100 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  tabs: {
    flexDirection: "row",
    backgroundColor: colors.cardSoft,
    borderRadius: radius.lg,
    padding: spacing.xs,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: "center",
    borderRadius: radius.md,
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { ...typography.body, color: colors.textMuted, fontWeight: "500" },
  tabTextActive: { color: colors.white, fontWeight: "700" },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  desc: { ...typography.body, color: colors.textSoft, lineHeight: 22 },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  metaLabel: { ...typography.bodySmall, color: colors.textMuted },
  metaValue: { ...typography.bodySmall, color: colors.text, fontWeight: "600" },
  permRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  permText: { ...typography.body, color: colors.text, flex: 1 },
  editBtn: { marginTop: spacing.sm },
});
}
