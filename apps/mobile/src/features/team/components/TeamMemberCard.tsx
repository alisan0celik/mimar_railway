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
  removing?: boolean;
  onRemove?: () => void;
};

export function TeamMemberCard({ user, canRemove, removing, onRemove }: TeamMemberCardProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();
  const roleLabel = user.roles.length > 0 ? user.roles.map((r) => r.name).join(", ") : "—";

  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials(user.fullName)}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.name}>{user.fullName}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <View style={styles.roleChip}>
          <Text style={styles.roleText}>{roleLabel}</Text>
        </View>
      </View>
      {canRemove ? (
        <Pressable
          accessibilityLabel={t("team.removeFromTeamLabel")}
          accessibilityRole="button"
          disabled={removing}
          hitSlop={8}
          onPress={onRemove}
          style={({ pressed }) => [styles.removeAction, pressed && styles.removePressed]}
        >
          {removing ? (
            <ActivityIndicator color={colors.danger} size="small" />
          ) : (
            <>
              <MaterialCommunityIcons color={colors.danger} name="account-remove-outline" size={20} />
              <Text style={styles.removeLabel}>{t("team.removeFromTeamLabel")}</Text>
            </>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
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
    removeAction: {
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
      minWidth: 56,
      paddingHorizontal: spacing.xs,
    },
    removePressed: { opacity: 0.75 },
    removeLabel: {
      ...typography.caption,
      color: colors.danger,
      fontWeight: "600",
      textAlign: "center",
    },
  });
}
