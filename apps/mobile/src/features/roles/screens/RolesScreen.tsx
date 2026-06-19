import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";

import {
  companiesApi,
  rolesApi,
  usersApi,
  type AssignableRoleDTO,
  type RoleDTO,
  type UserDTO,
} from "../../../services/api";
import { useAuthStore } from "../../../store/authStore";
import { useTranslation } from "../../../shared/i18n";
import { PERMISSIONS, useCan } from "../../../shared/permissions";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { AppButton, ConfirmDialog, DesignBackHeader, EmptyState, NoPermissionState, Screen } from "../../../shared/ui";
import { initials } from "../../../shared/utils/initials";

type RolesScreenProps = {
  pendingUserId?: string;
};

type RoleListItem = RoleDTO | AssignableRoleDTO;

function isOwnerRole(code: string): boolean {
  return code.startsWith("owner-");
}

function roleSortOrder(code: string): number {
  if (code.startsWith("office-manager-")) return 0;
  if (code.startsWith("office-employee-")) return 1;
  return 2;
}

function roleSubtitle(
  role: RoleListItem,
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  if (role.code.startsWith("office-manager-")) {
    return t("users.approveRole.officeManagerDesc");
  }
  if (role.code.startsWith("office-employee-")) {
    return t("users.approveRole.officeEmployeeDesc");
  }
  return role.description || t("roles.usersAssigned", { count: role.userCount });
}

export function RolesScreen({ pendingUserId }: RolesScreenProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();
  const canViewRoles = useCan(PERMISSIONS.ROLE_VIEW);
  const canCreateRole = useCan(PERMISSIONS.ROLE_CREATE);
  const canApprove = useCan(PERMISSIONS.USER_APPROVE);
  const companyId = useAuthStore((s) => s.user?.companyId);
  const approvalMode = Boolean(pendingUserId && canApprove);

  const [roles, setRoles] = useState<RoleListItem[]>([]);
  const [pendingUser, setPendingUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmRole, setConfirmRole] = useState<RoleListItem | null>(null);
  const [approving, setApproving] = useState(false);

  const fetchRoles = useCallback(() => {
    if (approvalMode && companyId) {
      return companiesApi
        .getAssignableRoles(companyId)
        .then((res) => setRoles(Array.isArray(res.data) ? res.data : []))
        .catch(() => setRoles([]));
    }

    return rolesApi
      .getAll()
      .then((res) => setRoles(res.data))
      .catch(() => setRoles([]));
  }, [approvalMode, companyId]);

  const assignableRoles = useMemo(
    () =>
      [...roles]
        .filter((role) => !isOwnerRole(role.code))
        .sort((a, b) => roleSortOrder(a.code) - roleSortOrder(b.code)),
    [roles],
  );

  useEffect(() => {
    setLoading(true);
    fetchRoles().finally(() => setLoading(false));
  }, [fetchRoles]);

  useEffect(() => {
    if (!pendingUserId) return;
    usersApi
      .getById(pendingUserId)
      .then((res) => setPendingUser(res.data))
      .catch(() => setPendingUser(null));
  }, [pendingUserId]);

  const handleSelectRole = (role: RoleListItem) => {
    if (approvalMode) {
      setConfirmRole(role);
      return;
    }
    router.push(`/(main)/roles/${role.id}`);
  };

  const handleConfirmApprove = async () => {
    if (!confirmRole || !pendingUserId || !companyId) return;
    setApproving(true);
    try {
      await companiesApi.approveMember(companyId, pendingUserId, { roleId: confirmRole.id });
      router.replace("/(main)/users/approval-success");
    } catch {
      Alert.alert(t("common.error"), t("users.alerts.approveError"));
    } finally {
      setApproving(false);
      setConfirmRole(null);
    }
  };

  if (!canViewRoles && !approvalMode) {
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

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <DesignBackHeader title={approvalMode ? t("roles.approveFlow.title") : t("roles.title")} />

      {approvalMode && pendingUser ? (
        <View style={styles.approvalBanner}>
          <View style={styles.approvalAvatar}>
            <Text style={styles.approvalAvatarText}>{initials(pendingUser.fullName)}</Text>
          </View>
          <View style={styles.approvalBody}>
            <Text style={styles.approvalName}>{pendingUser.fullName}</Text>
            <Text style={styles.approvalHint}>{t("roles.approveFlow.hint")}</Text>
          </View>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : assignableRoles.length === 0 ? (
        <EmptyState
          description={t("roles.approveFlow.emptyDesc")}
          title={t("roles.approveFlow.emptyTitle")}
        />
      ) : (
        <View style={styles.list}>
          {assignableRoles.map((role, idx) => (
            <Pressable
              key={role.id}
              onPress={() => handleSelectRole(role)}
              style={({ pressed }) => [
                styles.row,
                idx < assignableRoles.length - 1 && styles.rowBorder,
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.iconWrap, { backgroundColor: `${role.color || colors.primary}22` }]}>
                <MaterialCommunityIcons
                  color={role.color || colors.primary}
                  name={(role.icon || "shield-account-outline") as "shield-account-outline"}
                  size={22}
                />
              </View>
              <View style={styles.body}>
                <Text style={styles.name}>{role.name}</Text>
                <Text style={styles.count}>{roleSubtitle(role, t)}</Text>
              </View>
              <MaterialCommunityIcons
                color={colors.textMuted}
                name={approvalMode ? "check-circle-outline" : "chevron-right"}
                size={22}
              />
            </Pressable>
          ))}
        </View>
      )}

      {canCreateRole ? (
        <AppButton
          fullWidth
          onPress={() =>
            router.push({
              pathname: "/(main)/roles/create",
              params: pendingUserId ? { pendingUserId } : undefined,
            })
          }
          style={styles.addBtn}
          title={`+ ${approvalMode ? t("roles.approveFlow.createAndAssign") : t("roles.addRole")}`}
        />
      ) : null}

      <ConfirmDialog
        confirmLabel={t("roles.approveFlow.confirmAction")}
        loading={approving}
        message={
          confirmRole && pendingUser
            ? t("roles.approveFlow.confirmMessage", {
                name: pendingUser.fullName,
                role: confirmRole.name,
              })
            : ""
        }
        onCancel={() => setConfirmRole(null)}
        onConfirm={handleConfirmApprove}
        title={t("roles.approveFlow.confirmTitle")}
        visible={Boolean(confirmRole)}
      />
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    content: { paddingBottom: 100 },
    loading: { paddingVertical: 60, alignItems: "center" },
    approvalBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      backgroundColor: colors.primarySoft,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: `${colors.primary}44`,
      padding: spacing.lg,
      marginBottom: spacing.lg,
    },
    approvalAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
    },
    approvalAvatarText: { fontSize: 16, fontWeight: "700", color: colors.primary },
    approvalBody: { flex: 1 },
    approvalName: { ...typography.body, color: colors.text, fontWeight: "700" },
    approvalHint: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
    list: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
      marginBottom: spacing.lg,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      padding: spacing.lg,
    },
    rowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    pressed: { opacity: 0.9 },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    body: { flex: 1 },
    name: { ...typography.body, color: colors.text, fontWeight: "600" },
    count: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
    addBtn: { marginTop: spacing.sm },
  });
}
