import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useLocaleCode, useTranslation } from "../../../shared/i18n";
import type { UserDTO } from "../../../services/api";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { DesignStatusBadge } from "../../../shared/ui/DesignStatusBadge";
import { initials } from "../../../shared/utils/initials";

type PendingUserCardProps = {
  user: UserDTO;
  onPress: () => void;
};

function statusVariant(status: string): "warning" | "danger" | "success" {
  if (status === "pending") return "warning";
  if (status === "rejected") return "danger";
  return "success";
}

function statusKey(status: string): string {
  if (status === "pending") return "status.pendingApproval";
  if (status === "rejected") return "status.rejected";
  return "status.approved";
}

export function PendingUserCard({ user, onPress }: PendingUserCardProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();
  const locale = useLocaleCode();

  const formatApplicationDate = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(parsed);
  };
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials(user.fullName)}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.name}>{user.fullName}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <Text style={styles.role}>{user.title || t("common.none")}</Text>
        <Text style={styles.date}>{formatApplicationDate(user.createdAt)}</Text>
      </View>
      <View style={styles.right}>
        <DesignStatusBadge label={t(statusKey(user.approvalStatus))} variant={statusVariant(user.approvalStatus)} />
        <MaterialCommunityIcons color={colors.textMuted} name="chevron-right" size={22} />
      </View>
    </Pressable>
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
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  pressed: { opacity: 0.9 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 16, fontWeight: "700", color: colors.primary },
  body: { flex: 1 },
  name: { ...typography.body, color: colors.text, fontWeight: "700" },
  email: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  role: { ...typography.caption, color: colors.textSoft, marginTop: 2 },
  date: { ...typography.caption, color: colors.textDisabled, marginTop: 4 },
  right: { alignItems: "flex-end", gap: spacing.sm },
});
}
