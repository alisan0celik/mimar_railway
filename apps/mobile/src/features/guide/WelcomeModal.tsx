import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Modal, StyleSheet, Text, View } from "react-native";

import { useTranslation } from "../../shared/i18n";
import { radius, spacing, typography } from "../../shared/theme";
import { useThemedStyles, type AppColors } from "../../shared/theme";
import { useThemeColors } from "../../shared/theme/ThemeProvider";
import { AppButton } from "../../shared/ui";
import { roleLabels } from "../../shared/utils/roleLabel";
import { useAuthStore } from "../../store/authStore";
import { acceptWelcome, postponeWelcome, useGuideStore } from "./guide-store";
import { isCompanyOwner } from "./tour-filter";

export function WelcomeModal() {
  const visible = useGuideStore((s) => s.active?.kind === "welcome");
  const user = useAuthStore((s) => s.user);
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();

  if (!visible || !user) return null;

  const isOwner = isCompanyOwner(user);
  const companyName = user.companyName || t("guide.welcome.defaultCompany");
  const visibleRoles = user.roles.filter((role) => !role.code.startsWith("owner-"));
  const roleName = isOwner
    ? t("roles.builtIn.owner")
    : roleLabels(visibleRoles.length > 0 ? visibleRoles : user.roles, t);

  return (
    <Modal animationType="fade" onRequestClose={postponeWelcome} statusBarTranslucent transparent visible>
      <View style={styles.backdrop}>
        <View accessibilityViewIsModal style={styles.card}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons
              color={colors.primary}
              name={isOwner ? "rocket-launch-outline" : "hand-wave-outline"}
              size={34}
            />
          </View>
          <Text style={styles.title}>
            {isOwner
              ? t("guide.welcome.ownerTitle", { companyName })
              : t("guide.welcome.memberTitle", { companyName })}
          </Text>
          {!isOwner ? (
            <View style={styles.roleChip}>
              <Text style={styles.roleChipText}>{t("guide.welcome.roleLabel", { role: roleName })}</Text>
            </View>
          ) : null}
          <Text style={styles.body}>
            {isOwner ? t("guide.welcome.ownerBody") : t("guide.welcome.memberBody")}
          </Text>
          <AppButton fullWidth onPress={acceptWelcome} style={styles.primary} title={t("guide.welcome.start")} />
          <AppButton fullWidth onPress={postponeWelcome} title={t("guide.welcome.later")} variant="ghost" />
        </View>
      </View>
    </Modal>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: colors.overlay,
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.xl,
    },
    card: {
      width: "100%",
      maxWidth: 400,
      backgroundColor: colors.card,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      padding: spacing.xl,
      alignItems: "center",
    },
    iconWrap: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.lg,
    },
    title: { ...typography.h3, color: colors.text, fontWeight: "700", textAlign: "center" },
    roleChip: {
      marginTop: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.full,
      backgroundColor: colors.primarySoft,
    },
    roleChipText: { ...typography.caption, color: colors.primaryLight, fontWeight: "700" },
    body: {
      ...typography.body,
      color: colors.textSoft,
      textAlign: "center",
      marginTop: spacing.md,
      marginBottom: spacing.xl,
    },
    primary: { marginBottom: spacing.sm },
  });
}
