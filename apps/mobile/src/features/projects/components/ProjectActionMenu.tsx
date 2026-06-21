import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTranslation } from "../../../shared/i18n";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";

const MOBILE_SHEET_MAX_WIDTH = 428;

type ProjectActionMenuProps = {
  visible: boolean;
  projectName: string;
  loading?: boolean;
  onClose: () => void;
  onMarkCompleted: () => void;
};

export function ProjectActionMenu({
  visible,
  projectName,
  loading,
  onClose,
  onMarkCompleted,
}: ProjectActionMenuProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const sheetWidth =
    Platform.OS === "web" ? Math.min(windowWidth, MOBILE_SHEET_MAX_WIDTH) : windowWidth;

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <Pressable accessibilityLabel={t("common.cancel")} onPress={onClose} style={styles.backdrop} />

        <View
          style={[
            styles.sheetWrap,
            Platform.OS === "web" && styles.sheetWrapWeb,
            { paddingBottom: Math.max(insets.bottom, spacing.md) },
          ]}
        >
          <View style={[styles.sheet, { width: sheetWidth, maxWidth: "100%" }]}>
            <View style={styles.handle} />
            <Text numberOfLines={2} style={styles.title}>
              {projectName}
            </Text>

            <Pressable
              disabled={loading}
              onPress={onMarkCompleted}
              style={({ pressed }) => [styles.actionRow, pressed && styles.actionPressed]}
            >
              <View style={styles.actionIconWrap}>
                <MaterialCommunityIcons color={colors.primary} name="check-circle-outline" size={22} />
              </View>
              <Text style={styles.actionText}>{t("projects.markCompleted")}</Text>
            </Pressable>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.cancelBtn, pressed && styles.actionPressed]}
            >
              <Text style={styles.cancelText}>{t("common.cancel")}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "flex-end",
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.55)",
    },
    sheetWrap: {
      width: "100%",
    },
    sheetWrapWeb: {
      alignItems: "center",
    },
    sheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      borderBottomWidth: 0,
      ...Platform.select({
        web: {
          borderRadius: radius.xl,
          marginBottom: spacing.md,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.2,
          shadowRadius: 12,
        },
        default: {},
      }),
    },
    handle: {
      alignSelf: "center",
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.borderStrong,
      marginBottom: spacing.md,
    },
    title: {
      ...typography.bodySmall,
      color: colors.textMuted,
      fontWeight: "600",
      marginBottom: spacing.md,
      textAlign: "center",
    },
    actionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      minHeight: 52,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.surfaceMuted,
      marginBottom: spacing.sm,
    },
    actionPressed: { opacity: 0.85 },
    actionIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    actionText: {
      ...typography.body,
      color: colors.text,
      fontWeight: "600",
      flex: 1,
    },
    cancelBtn: {
      alignItems: "center",
      justifyContent: "center",
      minHeight: 48,
      paddingVertical: spacing.sm,
      marginTop: spacing.xs,
    },
    cancelText: {
      ...typography.body,
      color: colors.textMuted,
      fontWeight: "600",
    },
  });
}
