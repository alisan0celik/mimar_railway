import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, TextInput, View } from "react-native";
import { router } from "expo-router";

import { TeamMemberCard } from "../components/TeamMemberCard";
import { usersApi, type UserDTO } from "../../../services/api";
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

  const fetchMembers = useCallback(() => {
    setLoading(true);
    usersApi
      .getTeamMembers()
      .then((res) => {
        const payload = res.data as { data?: UserDTO[] } | UserDTO[];
        const list = Array.isArray(payload) ? payload : payload.data;
        setMembers(Array.isArray(list) ? list : []);
      })
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
              canRemove={canRemoveMember(member, currentUser, canRemove)}
              onRemove={() => handleRemoveMember(member)}
              removing={removingUserId === member.id}
              user={member}
            />
          ))}
        </View>
      )}

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
