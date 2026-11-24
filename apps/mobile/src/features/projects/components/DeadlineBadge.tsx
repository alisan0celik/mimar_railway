import { StyleSheet, Text, View } from "react-native";

import { useTranslation } from "../../../shared/i18n";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import type { DeadlineStatus } from "../utils/contractDeadline";

/** İhaleli işin kalan süresini renkli bir etiketle gösterir; süre bilinmiyorsa hiçbir şey çizmez. */
export function DeadlineBadge({ status }: { status: DeadlineStatus }) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();

  if (status.kind === "unknown") return null;

  let label: string;
  let tone: "success" | "warning" | "danger" | "info";
  switch (status.kind) {
    case "accepted":
      label = t("projects.tender.status.accepted");
      tone = "info";
      break;
    case "overdue":
      label = t("projects.tender.status.overdue", { days: status.daysLate });
      tone = "danger";
      break;
    case "dueSoon":
      label =
        status.daysLeft === 0
          ? t("projects.tender.status.dueToday")
          : t("projects.tender.status.dueSoon", { days: status.daysLeft });
      tone = "warning";
      break;
    default:
      label = t("projects.tender.status.onTrack", { days: status.daysLeft });
      tone = "success";
  }

  const background = {
    success: styles.successBg,
    warning: styles.warningBg,
    danger: styles.dangerBg,
    info: styles.infoBg,
  }[tone];
  const foreground = {
    success: styles.successText,
    warning: styles.warningText,
    danger: styles.dangerText,
    info: styles.infoText,
  }[tone];

  return (
    <View style={[styles.badge, background]}>
      <Text numberOfLines={1} style={[styles.text, foreground]}>
        {label}
      </Text>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    badge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.full,
      alignSelf: "flex-start",
    },
    text: { ...typography.caption, fontWeight: "700" },
    successBg: { backgroundColor: colors.successSoft },
    successText: { color: colors.success },
    warningBg: { backgroundColor: colors.warningSoft },
    warningText: { color: colors.warning },
    dangerBg: { backgroundColor: colors.dangerSoft },
    dangerText: { color: colors.danger },
    infoBg: { backgroundColor: colors.infoSoft },
    infoText: { color: colors.info },
  });
}
