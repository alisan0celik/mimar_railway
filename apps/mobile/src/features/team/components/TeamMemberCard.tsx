import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import type { UserDTO } from "../../../services/api";
import { useTranslation } from "../../../shared/i18n";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { initials } from "../../../shared/utils/initials";

type TeamMemberCardProps = {
  user: UserDTO;
  canRemove?: boolean;
  canChangeRole?: boolean;
  removing?: boolean;
  onRemove?: () => void;
  onChangeRole?: () => void;
};

export function TeamMemberCard({
  user,
  canRemove,
  canChangeRole,
  removing,
  onRemove,
  onChangeRole,
}: TeamMemberCardProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();
  const roleLabel = user.roles.length > 0 ? user.roles.map((r) => r.name).join(", ") : "—";

  const hasActions = Boolean(canChangeRole || canRemove);

  return (
    <View style={styles.card}>
      {/*
        Kimlik satırı tüm genişliği kullanır. Eylemler eskiden bu satırda
        duruyordu ve isim, e-posta ile rol rozetini kelime ortasından
        kırılacak kadar daraltıyordu; artık alttaki kendi satırındalar.
      */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(user.fullName)}</Text>
        </View>
        <View style={styles.body}>
          <Text numberOfLines={1} style={styles.name}>
            {user.fullName}
          </Text>
          <Text numberOfLines={1} style={styles.email}>
            {user.email}
          </Text>
          <View style={styles.roleChip}>
            <Text numberOfLines={1} style={styles.roleText}>
              {roleLabel}
            </Text>
          </View>
        </View>
      </View>

      {hasActions ? (
        <View style={styles.actions}>
          {canChangeRole ? (
            <Pressable
              accessibilityLabel={t("team.changeRoleLabel")}
              accessibilityRole="button"
              disabled={removing}
              onPress={onChangeRole}
              style={({ pressed }) => [
                styles.action,
                styles.roleAction,
                pressed && styles.actionPressed,
              ]}
            >
              <MaterialCommunityIcons
                color={colors.primary}
                name="shield-account-outline"
                size={18}
              />
              <Text numberOfLines={1} style={styles.roleActionText}>
                {t("team.changeRole")}
              </Text>
            </Pressable>
          ) : null}

          {canRemove ? (
            <Pressable
              accessibilityLabel={t("team.removeFromTeamLabel")}
              accessibilityRole="button"
              disabled={removing}
              onPress={onRemove}
              style={({ pressed }) => [
                styles.action,
                styles.removeAction,
                pressed && styles.actionPressed,
              ]}
            >
              {removing ? (
                <ActivityIndicator color={colors.danger} size="small" />
              ) : (
                <>
                  <MaterialCommunityIcons
                    color={colors.danger}
                    name="account-remove-outline"
                    size={18}
                  />
                  <Text numberOfLines={1} style={styles.removeLabel}>
                    {t("team.removeFromTeamLabel")}
                  </Text>
                </>
              )}
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { fontSize: 14, fontWeight: "700", color: colors.primary },
    body: { flex: 1, gap: 2 },
    name: { ...typography.body, color: colors.text, fontWeight: "600" },
    email: { ...typography.caption, color: colors.textMuted },
    roleChip: {
      alignSelf: "flex-start",
      marginTop: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.sm,
      backgroundColor: colors.primarySoft,
    },
    roleText: { ...typography.caption, color: colors.primary, fontWeight: "600" },
    actions: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    action: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.md,
    },
    actionPressed: { opacity: 0.75 },
    roleAction: { backgroundColor: colors.primarySoft },
    roleActionText: {
      ...typography.caption,
      color: colors.primary,
      fontWeight: "600",
    },
    removeAction: { backgroundColor: colors.dangerSoft },
    removeLabel: {
      ...typography.caption,
      color: colors.danger,
      fontWeight: "600",
    },
  });
}
