import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";

import { TeamMemberCard } from "../components/TeamMemberCard";
import { rolesApi, usersApi, type UserDTO } from "../../../services/api";
import { fetchWithReadCache } from "../../../offline/cache/read-cache";
import { useAuthStore } from "../../../store/authStore";
import { useTranslation } from "../../../shared/i18n";
import { PERMISSIONS, useCan } from "../../../shared/permissions";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import {
  ConfirmDialog,
  DesignBackHeader,
  EmptyState,
  NoPermissionState,
  Screen,
} from "../../../shared/ui";

function isOwnerRole(code: string) {
  return code.startsWith("owner-");
}

function isManagerRole(code: string) {
  return code.startsWith("office-manager-");
}

function canRemoveMember(
  member: UserDTO,
  currentUser: UserDTO | null,
  hasRemovePermission: boolean,
): boolean {
  if (!hasRemovePermission || !currentUser) return false;
  if (member.id === currentUser.id) return false;
  const memberIsOwner = member.roles.some((r) => isOwnerRole(r.code));
  if (memberIsOwner) return false;
  const memberIsManager = member.roles.some((r) => isManagerRole(r.code));
  const currentUserIsOwner = currentUser.roles.some((r) => isOwnerRole(r.code));
  if (memberIsManager && !currentUserIsOwner) return false;
  return true;
}

/**
 * Rol değiştirme, çıkarmayla aynı sınırlara tabidir: sahibin rolü
 * değiştirilemez, yöneticinin rolünü yalnızca sahip değiştirebilir ve
 * kimse kendi rolünü düşüremez.
 */
function canChangeMemberRole(
  member: UserDTO,
  currentUser: UserDTO | null,
  hasAssignPermission: boolean,
): boolean {
  if (!hasAssignPermission || !currentUser) return false;
  if (member.id === currentUser.id) return false;
  if (member.roles.some((r) => isOwnerRole(r.code))) return false;

  const memberIsManager = member.roles.some((r) => isManagerRole(r.code));
  const currentUserIsOwner = currentUser.roles.some((r) => isOwnerRole(r.code));
  if (memberIsManager && !currentUserIsOwner) return false;

  return true;
}

type PendingRemoval = {
  member: UserDTO;
};

export function OfficeTeamScreen() {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();
  const currentUser = useAuthStore((s) => s.user);
  const canManageTeam = useCan(PERMISSIONS.USER_ROLE_ASSIGN);
  const canRemove = useCan(PERMISSIONS.USER_REMOVE);
  const [members, setMembers] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<PendingRemoval | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [roleTarget, setRoleTarget] = useState<UserDTO | null>(null);
  const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([]);
  const [savingRoleId, setSavingRoleId] = useState<string | null>(null);

  const fetchMembers = useCallback(() => {
    setLoading(true);
    // Çevrimdışında son bilinen ekip listesi gösterilsin
    fetchWithReadCache<UserDTO[]>("team:members", async () => {
      const res = await usersApi.getTeamMembers();
      const payload = res.data as { data?: UserDTO[] } | UserDTO[];
      const list = Array.isArray(payload) ? payload : payload.data;
      return Array.isArray(list) ? list : [];
    })
      .then((list) => setMembers(Array.isArray(list) ? list : []))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (canManageTeam) fetchMembers();
  }, [canManageTeam, fetchMembers]);

  const q = query.trim().toLowerCase();

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      if (!q) return true;
      return (
        member.fullName.toLowerCase().includes(q) ||
        member.email.toLowerCase().includes(q) ||
        member.roles.some((r) => r.name.toLowerCase().includes(q))
      );
    });
  }, [members, q]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(main)/(tabs)/profile");
  }, []);

  const handleRemoveMember = useCallback(
    (member: UserDTO) => {
      if (!canRemoveMember(member, currentUser, canRemove)) return;
      setPendingRemoval({ member });
    },
    [canRemove, currentUser],
  );

  const handleChangeRole = useCallback(async (member: UserDTO) => {
    setRoleTarget(member);
    try {
      const { data } = await rolesApi.getAll();
      // Sahip rolü atanamaz; şirketin tek sahibi vardır.
      setRoles(data.filter((role) => !isOwnerRole(role.code)).map((r) => ({ id: r.id, name: r.name })));
    } catch {
      setRoles([]);
    }
  }, []);

  const applyRole = useCallback(
    async (roleId: string) => {
      if (!roleTarget) return;
      setSavingRoleId(roleId);
      try {
        await usersApi.replaceRole(roleTarget.id, roleId);
        setRoleTarget(null);
        fetchMembers();
        setSuccessMessage(t("team.roleUpdated"));
      } catch (error: unknown) {
        const msg =
          (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          t("team.roleUpdateError");
        setRoleTarget(null);
        setErrorMessage(msg);
      } finally {
        setSavingRoleId(null);
      }
    },
    [roleTarget, fetchMembers, t],
  );

  const confirmRemoveMember = useCallback(async () => {
    if (!pendingRemoval) return;

    const { member } = pendingRemoval;
    setRemovingUserId(member.id);
    try {
      await usersApi.removeFromCompany(member.id);
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      setPendingRemoval(null);
      setSuccessMessage(t("team.removedMessage"));
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        t("team.removeError");
      setPendingRemoval(null);
      setErrorMessage(msg);
    } finally {
      setRemovingUserId(null);
    }
  }, [pendingRemoval, t]);

  if (!canManageTeam) {
    return (
      <Screen scroll={false}>
        <NoPermissionState
          actionLabel={t("states.backHome")}
          description={t("team.noPermission")}
          onRequestAccess={() => router.replace("/(main)/(tabs)/dashboard")}
          title={t("states.noPermission")}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <DesignBackHeader
        fallbackRoute="/(main)/(tabs)/profile"
        onBack={handleBack}
        title={t("team.title")}
      />

      <TextInput
        onChangeText={setQuery}
        placeholder={t("team.search")}
        placeholderTextColor={colors.textMuted}
        style={styles.searchInput}
        value={query}
      />

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : filteredMembers.length === 0 ? (
        <EmptyState description={t("team.empty")} title={t("team.emptyTitle")} />
      ) : (
        <View style={styles.list}>
          {filteredMembers.map((member) => (
            <TeamMemberCard
              key={member.id}
              canChangeRole={canChangeMemberRole(member, currentUser, canManageTeam)}
              canRemove={canRemoveMember(member, currentUser, canRemove)}
              onChangeRole={() => handleChangeRole(member)}
              onRemove={() => handleRemoveMember(member)}
              removing={removingUserId === member.id}
              user={member}
            />
          ))}
        </View>
      )}

      <Modal
        animationType="fade"
        onRequestClose={() => setRoleTarget(null)}
        transparent
        visible={roleTarget !== null}
      >
        <Pressable onPress={() => setRoleTarget(null)} style={styles.roleBackdrop}>
          <Pressable onPress={(event) => event.stopPropagation()} style={styles.roleSheet}>
            <Text style={styles.roleSheetTitle}>{t("team.changeRole")}</Text>
            <Text style={styles.roleSheetSubtitle}>{roleTarget?.fullName ?? ""}</Text>

            {roles.length === 0 ? (
              <ActivityIndicator color={colors.primary} style={styles.roleLoading} />
            ) : (
              roles.map((role) => {
                const active = roleTarget?.roles.some((r) => r.id === role.id) ?? false;
                return (
                  <Pressable
                    key={role.id}
                    disabled={savingRoleId !== null}
                    onPress={() => applyRole(role.id)}
                    style={[styles.roleOption, active && styles.roleOptionActive]}
                  >
                    <MaterialCommunityIcons
                      color={active ? colors.primary : colors.textDisabled}
                      name={active ? "radiobox-marked" : "radiobox-blank"}
                      size={20}
                    />
                    <Text style={styles.roleOptionText}>{role.name}</Text>
                    {savingRoleId === role.id ? (
                      <ActivityIndicator color={colors.primary} size="small" />
                    ) : null}
                  </Pressable>
                );
              })
            )}

            <Pressable onPress={() => setRoleTarget(null)} style={styles.roleCancel}>
              <Text style={styles.roleCancelText}>{t("common.cancel")}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <ConfirmDialog
        cancelLabel={t("common.no")}
        confirmDestructive
        confirmLabel={t("common.yes")}
        loading={removingUserId === pendingRemoval?.member.id}
        message={
          pendingRemoval
            ? t("team.removeConfirm", { name: pendingRemoval.member.fullName })
            : ""
        }
        onCancel={() => setPendingRemoval(null)}
        onConfirm={confirmRemoveMember}
        title={t("team.removeTitle")}
        visible={pendingRemoval !== null}
      />

      <ConfirmDialog
        confirmLabel={t("common.ok")}
        message={successMessage ?? ""}
        onCancel={() => setSuccessMessage(null)}
        onConfirm={() => setSuccessMessage(null)}
        singleAction
        title={t("team.removedTitle")}
        visible={successMessage !== null}
      />

      <ConfirmDialog
        confirmLabel={t("common.ok")}
        message={errorMessage ?? ""}
        onCancel={() => setErrorMessage(null)}
        onConfirm={() => setErrorMessage(null)}
        singleAction
        title={t("states.error")}
        visible={errorMessage !== null}
      />
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    content: { paddingBottom: spacing.xxl },
    roleBackdrop: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "flex-end",
    },
    roleSheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      padding: spacing.xl,
      gap: spacing.sm,
    },
    roleSheetTitle: { ...typography.body, color: colors.text, fontWeight: "700" },
    roleSheetSubtitle: {
      ...typography.bodySmall,
      color: colors.textMuted,
      marginBottom: spacing.sm,
    },
    roleLoading: { marginVertical: spacing.lg },
    roleOption: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    roleOptionActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
    roleOptionText: { ...typography.bodySmall, color: colors.text, flex: 1 },
    roleCancel: { alignItems: "center", paddingVertical: spacing.md, marginTop: spacing.xs },
    roleCancelText: { ...typography.bodySmall, color: colors.textMuted, fontWeight: "600" },
    searchInput: {
      ...typography.body,
      color: colors.text,
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      minHeight: 48,
      marginBottom: spacing.md,
    },
    loading: { paddingVertical: spacing.xxl, alignItems: "center" },
    list: { gap: spacing.sm, marginTop: spacing.sm },
  });
}
