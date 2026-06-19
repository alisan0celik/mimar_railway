import type { Href } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import {
  projectApi,
  type AvailableTeamMemberDTO,
} from "../../../services/api/project.api";
import { useTranslation } from "../../../shared/i18n";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { DesignBackHeader, Screen } from "../../../shared/ui";
import { initials } from "../../../shared/utils/initials";

const AVATAR_COLORS = [
  { bg: "rgba(99,102,241,0.22)", text: "#818CF8" },
  { bg: "rgba(52,211,153,0.22)", text: "#34D399" },
  { bg: "rgba(251,191,36,0.22)", text: "#FBBF24" },
  { bg: "rgba(192,132,252,0.22)", text: "#C084FC" },
  { bg: "rgba(56,189,248,0.22)", text: "#38BDF8" },
];

export function CreateTeamMemberScreen({ projectId }: { projectId: string }) {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();
  const router = useRouter();

  const [userQuery, setUserQuery] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<AvailableTeamMemberDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const projectDetailRoute = useMemo(
    () =>
      projectId
        ? ({
            pathname: "/(main)/projects/[projectId]",
            params: { projectId, tab: "team" },
          } as Href)
        : ("/(main)/(tabs)/projects" as Href),
    [projectId],
  );

  const leaveScreen = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(projectDetailRoute);
  }, [projectDetailRoute, router]);

  const fetchAvailableUsers = useCallback(async () => {
    if (!projectId) return;
    setLoadingUsers(true);
    setLoadError(false);
    try {
      const users = await projectApi.getAvailableTeamMembers(projectId);
      setAvailableUsers(users);
    } catch {
      setAvailableUsers([]);
      setLoadError(true);
    } finally {
      setLoadingUsers(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchAvailableUsers();
  }, [fetchAvailableUsers]);

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return availableUsers;
    return availableUsers.filter(
      (user) =>
        user.fullName.toLowerCase().includes(q) ||
        user.title?.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q),
    );
  }, [userQuery, availableUsers]);

  const toggleUser = (userId: string) => {
    setSelectedUserIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId],
    );
  };

  const canSave = selectedUserIds.length > 0 && !loading;

  const handleAdd = async () => {
    if (!canSave) return;
    try {
      setLoading(true);
      await projectApi.addTeamMembers(projectId, selectedUserIds);
      leaveScreen();
    } catch {
      setLoading(false);
    }
  };

  return (
    <Screen contentContainerStyle={styles.content} scroll>
      <DesignBackHeader
        fallbackRoute={projectDetailRoute}
        onBack={leaveScreen}
        title={t("projects.teamMember.title")}
      />

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardLabel}>{t("projects.teamMember.selectEmployee")}</Text>
          {selectedUserIds.length > 0 ? (
            <Text style={styles.selectedCount}>
              {t("projects.teamMember.selectedCount", { count: selectedUserIds.length })}
            </Text>
          ) : null}
        </View>

        <View style={styles.searchWrap}>
          <MaterialCommunityIcons color={colors.textMuted} name="magnify" size={18} />
          <TextInput
            onChangeText={setUserQuery}
            placeholder={t("projects.teamMember.searchPlaceholder")}
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            value={userQuery}
          />
          {userQuery.length > 0 ? (
            <Pressable onPress={() => setUserQuery("")}>
              <MaterialCommunityIcons color={colors.textMuted} name="close-circle" size={16} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.userList}>
          {loadingUsers ? (
            <View style={styles.emptyRow}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : loadError ? (
            <View style={styles.emptyRow}>
              <MaterialCommunityIcons color={colors.danger} name="alert-circle-outline" size={28} />
              <Text style={styles.emptyText}>{t("projects.teamMember.loadFailed")}</Text>
              <Pressable onPress={fetchAvailableUsers} style={styles.retryBtn}>
                <Text style={styles.retryText}>{t("common.retry")}</Text>
              </Pressable>
            </View>
          ) : filteredUsers.length === 0 ? (
            <View style={styles.emptyRow}>
              <MaterialCommunityIcons color={colors.textMuted} name="account-search-outline" size={28} />
              <Text style={styles.emptyText}>
                {availableUsers.length === 0
                  ? t("projects.teamMember.noAvailable")
                  : t("projects.teamMember.noUsers")}
              </Text>
            </View>
          ) : (
            filteredUsers.map((user, idx) => {
              const isSelected = selectedUserIds.includes(user.id);
              const aColor = AVATAR_COLORS[idx % AVATAR_COLORS.length] ?? AVATAR_COLORS[0];
              return (
                <Pressable
                  key={user.id}
                  onPress={() => toggleUser(user.id)}
                  style={[
                    styles.userRow,
                    idx < filteredUsers.length - 1 && styles.userRowBorder,
                    isSelected && styles.userRowSelected,
                  ]}
                >
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected ? (
                      <MaterialCommunityIcons color={colors.white} name="check" size={14} />
                    ) : null}
                  </View>
                  <View style={[styles.avatar, { backgroundColor: aColor.bg }]}>
                    <Text style={[styles.avatarText, { color: aColor.text }]}>
                      {initials(user.fullName)}
                    </Text>
                  </View>
                  <View style={styles.userBody}>
                    <Text style={styles.userName}>{user.fullName}</Text>
                    {user.title ? <Text style={styles.userTitle}>{user.title}</Text> : null}
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      </View>

      <Pressable
        disabled={!canSave}
        onPress={handleAdd}
        style={({ pressed }) => [
          styles.saveBtn,
          !canSave && styles.saveBtnDisabled,
          pressed && styles.saveBtnPressed,
        ]}
      >
        <MaterialCommunityIcons color="#fff" name="account-plus-outline" size={20} />
        <Text style={styles.saveBtnText}>
          {loading
            ? t("projects.teamMember.adding")
            : selectedUserIds.length > 0
              ? t("projects.teamMember.addToTeamCount", { count: selectedUserIds.length })
              : t("projects.teamMember.addToTeam")}
        </Text>
      </Pressable>
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    content: { paddingBottom: 100 },
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      marginBottom: spacing.md,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.md,
      gap: spacing.sm,
    },
    cardLabel: {
      ...typography.label,
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      flex: 1,
    },
    selectedCount: {
      ...typography.caption,
      color: colors.primary,
      fontWeight: "700",
    },
    searchWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      backgroundColor: colors.input,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.md,
      minHeight: 46,
    },
    searchInput: {
      flex: 1,
      ...typography.body,
      color: colors.text,
      paddingVertical: spacing.sm,
    },
    userList: {
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    emptyRow: {
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      paddingVertical: spacing.xl,
    },
    emptyText: { ...typography.body, color: colors.textMuted, textAlign: "center" },
    retryBtn: {
      marginTop: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    retryText: { ...typography.body, color: colors.primary, fontWeight: "600" },
    userRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      padding: spacing.md,
      backgroundColor: colors.cardSoft,
    },
    userRowSelected: {
      backgroundColor: colors.primarySoft,
    },
    userRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.card,
    },
    checkboxSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { fontSize: 15, fontWeight: "700" },
    userBody: { flex: 1 },
    userName: { ...typography.body, color: colors.text, fontWeight: "600" },
    userTitle: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
    saveBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      backgroundColor: colors.primary,
      borderRadius: radius.lg,
      paddingVertical: spacing.lg,
      marginTop: spacing.sm,
    },
    saveBtnDisabled: { opacity: 0.4 },
    saveBtnPressed: { opacity: 0.85 },
    saveBtnText: { ...typography.body, color: "#fff", fontWeight: "700", fontSize: 16 },
  });
}
