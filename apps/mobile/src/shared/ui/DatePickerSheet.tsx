import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { useTranslation } from "../i18n";
import { radius, spacing, typography } from "../theme";
import { useThemedStyles, type AppColors } from "../theme";
import { useThemeColors } from "../theme/ThemeProvider";

/**
 * Uygulama renklerinde tarih seçici.
 *
 * İşletim sisteminin tarih diyaloğu temaya uydurulamıyor ve ekranda yabancı
 * duruyor. Değer "YYYY-AA-GG" metni olarak alınıp veriliyor; saat dilimine
 * bağlı `Date` dönüşümü olmadığı için seçilen gün kaymıyor.
 */

const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const MONTHS = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
] as const;

type DayParts = { year: number; month: number; day: number };

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

function parse(value: string | null | undefined): DayParts | null {
  const match = value ? /^(\d{4})-(\d{2})-(\d{2})/.exec(value) : null;
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]) - 1, day: Number(match[3]) };
}

function format({ year, month, day }: DayParts): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function todayParts(): DayParts {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Ayın ilk gününün haftadaki yeri; hafta pazartesi başlıyor. */
function leadingBlanks(year: number, month: number): number {
  const weekday = new Date(year, month, 1).getDay();
  return weekday === 0 ? 6 : weekday - 1;
}

type DatePickerSheetProps = {
  visible: boolean;
  title: string;
  value: string | null;
  onCancel: () => void;
  onConfirm: (value: string | null) => void;
  /** Seçili tarihi boşaltma düğmesi gösterilsin mi? */
  allowClear?: boolean;
};

export function DatePickerSheet({
  visible,
  title,
  value,
  onCancel,
  onConfirm,
  allowClear = false,
}: DatePickerSheetProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();

  const [selected, setSelected] = useState<DayParts | null>(() => parse(value));
  const [view, setView] = useState(() => parse(value) ?? todayParts());

  // Her açılışta kayıtlı değerden ya da bugünden başla.
  useEffect(() => {
    if (!visible) return;
    const initial = parse(value);
    setSelected(initial);
    setView(initial ?? todayParts());
  }, [visible, value]);

  const cells = useMemo(() => {
    const blanks = Array.from({ length: leadingBlanks(view.year, view.month) }, () => null);
    const days = Array.from({ length: daysInMonth(view.year, view.month) }, (_, index) => index + 1);
    return [...blanks, ...days];
  }, [view.year, view.month]);

  const today = todayParts();
  const shiftMonth = (delta: number) =>
    setView((current) => {
      const month = current.month + delta;
      return { year: current.year + Math.floor(month / 12), month: ((month % 12) + 12) % 12, day: 1 };
    });

  const isSame = (parts: DayParts | null, day: number) =>
    parts !== null && parts.year === view.year && parts.month === view.month && parts.day === day;

  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={visible}>
      <Pressable onPress={onCancel} style={styles.backdrop}>
        <Pressable onPress={(event) => event.stopPropagation()} style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>

          <View style={styles.monthRow}>
            <Pressable
              accessibilityLabel={t("datePicker.previousMonth")}
              hitSlop={8}
              onPress={() => shiftMonth(-1)}
              style={styles.navBtn}
            >
              <MaterialCommunityIcons color={colors.text} name="chevron-left" size={24} />
            </Pressable>
            <Text style={styles.monthLabel}>
              {`${t(`calendar.months.${MONTHS[view.month]}`)} ${view.year}`}
            </Text>
            <Pressable
              accessibilityLabel={t("datePicker.nextMonth")}
              hitSlop={8}
              onPress={() => shiftMonth(1)}
              style={styles.navBtn}
            >
              <MaterialCommunityIcons color={colors.text} name="chevron-right" size={24} />
            </Pressable>
          </View>

          <View style={styles.grid}>
            {WEEKDAYS.map((weekday) => (
              <Text key={weekday} style={styles.weekday}>
                {t(`calendar.weekdays.${weekday}`)}
              </Text>
            ))}
            {cells.map((day, index) =>
              day === null ? (
                <View key={`blank-${index}`} style={styles.cell} />
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSame(selected, day) }}
                  key={day}
                  onPress={() => setSelected({ year: view.year, month: view.month, day })}
                  style={styles.cell}
                >
                  <View
                    style={[
                      styles.dayCircle,
                      isSame(today, day) && styles.dayToday,
                      isSame(selected, day) && styles.daySelected,
                    ]}
                  >
                    <Text style={[styles.dayText, isSame(selected, day) && styles.dayTextSelected]}>
                      {day}
                    </Text>
                  </View>
                </Pressable>
              ),
            )}
          </View>

          <View style={styles.actions}>
            {allowClear ? (
              <Pressable onPress={() => onConfirm(null)} style={styles.clearBtn}>
                <Text style={styles.clearText}>{t("datePicker.clear")}</Text>
              </Pressable>
            ) : null}
            <Pressable onPress={onCancel} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>{t("common.cancel")}</Text>
            </Pressable>
            <Pressable
              disabled={!selected}
              onPress={() => selected && onConfirm(format(selected))}
              style={[styles.confirmBtn, !selected && styles.confirmBtnDisabled]}
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
    // Tablette tam genişlikte açılırsa gün kutuları büyüyüp takvim ekrana
    // sığmıyordu; pencere telefon genişliğinde tutuluyor.
    sheet: {
      width: "100%",
      maxWidth: 480,
      alignSelf: "center",
      backgroundColor: colors.card,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      padding: spacing.xl,
    },
    title: { ...typography.body, color: colors.text, fontWeight: "700" },
    monthRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    navBtn: { padding: spacing.xs },
    monthLabel: { ...typography.body, color: colors.text, fontWeight: "700" },
    grid: { flexDirection: "row", flexWrap: "wrap" },
    weekday: {
      width: `${100 / 7}%`,
      textAlign: "center",
      ...typography.caption,
      color: colors.textMuted,
      fontWeight: "600",
      paddingVertical: spacing.xs,
    },
    cell: { width: `${100 / 7}%`, height: 44, alignItems: "center", justifyContent: "center" },
    dayCircle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
    },
    dayToday: { borderWidth: 1, borderColor: colors.primary },
    daySelected: { backgroundColor: colors.primary, borderColor: colors.primary },
    dayText: { ...typography.bodySmall, color: colors.text },
    dayTextSelected: { color: colors.white, fontWeight: "700" },
    actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
    clearBtn: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
    },
    clearText: { ...typography.bodySmall, color: colors.danger, fontWeight: "600" },
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
    confirmBtnDisabled: { opacity: 0.5 },
    confirmText: { ...typography.bodySmall, color: colors.white, fontWeight: "700" },
  });
}
