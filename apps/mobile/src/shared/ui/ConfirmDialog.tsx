import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTranslation } from "../i18n";
import { radius, spacing, typography } from "../theme";
import { useThemedStyles, type AppColors } from "../theme";
import { useThemeColors } from "../theme/ThemeProvider";

const MOBILE_SHEET_MAX_WIDTH = 428;

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmDestructive?: boolean;
  loading?: boolean;
  singleAction?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  confirmDestructive,
  loading,
  singleAction,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const sheetWidth =
    Platform.OS === "web" ? Math.min(windowWidth, MOBILE_SHEET_MAX_WIDTH) : windowWidth;

  return (
    <Modal
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <Pressable accessibilityLabel={t("common.cancel")} onPress={onCancel} style={styles.backdrop} />

        <View
          style={[
            styles.sheetWrap,
            Platform.OS === "web" && styles.sheetWrapWeb,
            { paddingBottom: Math.max(insets.bottom, spacing.md) },
          ]}
        >
          <View style={[styles.sheet, { width: sheetWidth, maxWidth: "100%" }]}>
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons
                color={confirmDestructive ? colors.danger : colors.primary}
                name={confirmDestructive ? "alert-circle-outline" : "information-outline"}
                size={28}
              />
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>

            <View style={styles.actions}>
              {!singleAction ? (
                <Pressable
                  disabled={loading}
                  onPress={onCancel}
                  style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
                >
                  <Text style={styles.cancelText}>{cancelLabel ?? t("common.no")}</Text>
                </Pressable>
              ) : null}
              <Pressable
                disabled={loading}
                onPress={onConfirm}
                style={({ pressed }) => [
                  styles.confirmBtn,
                  confirmDestructive && styles.confirmBtnDestructive,
                  singleAction && styles.confirmBtnFull,
                  pressed && styles.pressed,
                ]}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.confirmText}>
                    {confirmLabel ?? (singleAction ? t("common.ok") : t("common.yes"))}
                  </Text>
                )}
              </Pressable>
            </View>
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
      justifyContent: "center",
      backgroundColor: "rgba(0,0,0,0.55)",
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    sheetWrap: {
      alignItems: "center",
      paddingHorizontal: spacing.md,
    },
    sheetWrapWeb: {
      alignSelf: "center",
      width: "100%",
      maxWidth: MOBILE_SHEET_MAX_WIDTH,
    },
    sheet: {
      backgroundColor: colors.card,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    iconWrap: {
      alignSelf: "center",
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.cardSoft,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.xs,
    },
    title: {
      ...typography.h3,
      color: colors.text,
      fontWeight: "700",
      textAlign: "center",
    },
    message: {
      ...typography.bodySmall,
      color: colors.textMuted,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: spacing.sm,
    },
    actions: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    cancelBtn: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 48,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.cardSoft,
    },
    cancelText: {
      ...typography.body,
      color: colors.text,
      fontWeight: "600",
    },
    confirmBtn: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 48,
      borderRadius: radius.lg,
      backgroundColor: colors.primary,
    },
    confirmBtnDestructive: {
      backgroundColor: colors.danger,
    },
    confirmBtnFull: {
      flex: 1,
    },
    confirmText: {
      ...typography.body,
      color: colors.white,
      fontWeight: "700",
    },
    pressed: { opacity: 0.85 },
  });
}
