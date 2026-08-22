import { useEffect, useMemo, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useTranslation } from "../../../shared/i18n";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";

/**
 * Uygulama renklerinde saat seçici.
 *
 * İşletim sisteminin kendi saat diyaloğu temaya uydurulamıyor ve ekranda
 * yabancı duruyordu; saat elle yazılınca da "14.30", "2 pm" gibi ayrıştırılamayan
 * değerler girilebiliyordu. Buradan seçim her zaman "HH:MM" üretir.
 */

const HOURS = Array.from({ length: 24 }, (_, index) => index);
const MINUTE_STEP = 5;
const MINUTES = Array.from({ length: 60 / MINUTE_STEP }, (_, index) => index * MINUTE_STEP);

const ROW_HEIGHT = 44;

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

/** "14:30" değerini ayrıştırır; okunamazsa şimdiki saate yuvarlar. */
function parseValue(value: string): { hour: number; minute: number } {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (match) {
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (hour <= 23 && minute <= 59) {
      return { hour, minute: Math.round(minute / MINUTE_STEP) * MINUTE_STEP % 60 };
    }
  }

  const now = new Date();
  return { hour: now.getHours(), minute: Math.round(now.getMinutes() / MINUTE_STEP) * MINUTE_STEP % 60 };
}

type TimePickerSheetProps = {
  visible: boolean;
  value: string;
  onCancel: () => void;
  onConfirm: (value: string) => void;
};

export function TimePickerSheet({ visible, value, onCancel, onConfirm }: TimePickerSheetProps) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();

  const initial = useMemo(() => parseValue(value), [value]);
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);

  const hourRef = useRef<ScrollView>(null);
  const minuteRef = useRef<ScrollView>(null);

  // Açılışta seçili değerleri göster; liste uzun olduğu için kaydırılır.
  useEffect(() => {
    if (!visible) return;
    const next = parseValue(value);
    setHour(next.hour);
    setMinute(next.minute);

    const timer = setTimeout(() => {
      hourRef.current?.scrollTo({ y: next.hour * ROW_HEIGHT, animated: false });
      minuteRef.current?.scrollTo({ y: (next.minute / MINUTE_STEP) * ROW_HEIGHT, animated: false });
    }, 0);

    return () => clearTimeout(timer);
  }, [visible, value]);

  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={visible}>
      <Pressable onPress={onCancel} style={styles.backdrop}>
        <Pressable onPress={(event) => event.stopPropagation()} style={styles.sheet}>
          <Text style={styles.title}>{t("calendar.form.timePickerTitle")}</Text>
          <Text style={styles.preview}>{`${pad(hour)}:${pad(minute)}`}</Text>

          <View style={styles.columns}>
            <ScrollView
              ref={hourRef}
              showsVerticalScrollIndicator={false}
              style={styles.column}
            >
              {HOURS.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setHour(item)}
                  style={[styles.row, item === hour && styles.rowActive]}
                >
                  <Text style={[styles.rowText, item === hour && styles.rowTextActive]}>
                    {pad(item)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.separator}>:</Text>

            <ScrollView
              ref={minuteRef}
              showsVerticalScrollIndicator={false}
              style={styles.column}
            >
              {MINUTES.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setMinute(item)}
                  style={[styles.row, item === minute && styles.rowActive]}
                >
                  <Text style={[styles.rowText, item === minute && styles.rowTextActive]}>
                    {pad(item)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.actions}>
            <Pressable onPress={onCancel} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>{t("common.cancel")}</Text>
            </Pressable>
            <Pressable
              onPress={() => onConfirm(`${pad(hour)}:${pad(minute)}`)}
              style={styles.confirmBtn}
            >
              <Text style={styles.confirmText}>{t("common.ok")}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: "flex-end" },
    sheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      padding: spacing.xl,
    },
    title: { ...typography.body, color: colors.text, fontWeight: "700" },
    preview: {
      ...typography.h2,
      color: colors.primary,
      fontWeight: "700",
      textAlign: "center",
      marginTop: spacing.sm,
    },
    columns: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.md,
      marginTop: spacing.md,
    },
    column: {
      height: ROW_HEIGHT * 4,
      width: 88,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      backgroundColor: colors.input,
    },
    row: { height: ROW_HEIGHT, alignItems: "center", justifyContent: "center" },
    rowActive: { backgroundColor: colors.primarySoft },
    rowText: { ...typography.body, color: colors.textMuted },
    rowTextActive: { color: colors.primary, fontWeight: "700" },
    separator: { ...typography.h3, color: colors.textMuted },
    actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
    cancelBtn: {
      flex: 1,
      alignItems: "center",
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceMuted,
    },
    cancelText: { ...typography.bodySmall, color: colors.textMuted, fontWeight: "600" },
    confirmBtn: {
      flex: 1,
      alignItems: "center",
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.primary,
    },
    confirmText: { ...typography.bodySmall, color: colors.white, fontWeight: "700" },
  });
}
