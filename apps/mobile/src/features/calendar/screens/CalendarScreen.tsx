import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState, useEffect } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import {
  calendarApi,
  CalendarEventDTO,
} from "../../../services/api/calendar.api";
import { useTranslation } from "../../../shared/i18n";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { AppButton, AppInput, DesignBackHeader, Screen } from "../../../shared/ui";

const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const MONTH_KEYS = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
] as const;

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function toEventDate(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}T12:00:00.000Z`;
}

export function CalendarScreen() {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(5);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [events, setEvents] = useState<CalendarEventDTO[]>([]);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const weekdays = useMemo(
    () => WEEKDAY_KEYS.map((key) => t(`calendar.weekdays.${key}`)),
    [t],
  );
  const monthNames = useMemo(
    () => MONTH_KEYS.map((key) => t(`calendar.months.${key}`)),
    [t],
  );

  useEffect(() => {
    fetchEvents();
  }, [year, month]);

  const fetchEvents = async () => {
    try {
      const res = await calendarApi.getEvents(year, month);
      setEvents(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateEvent = async () => {
    const trimmedTitle = title.trim();
    const trimmedTime = time.trim();

    if (!trimmedTitle || !trimmedTime) {
      Alert.alert(t("calendar.form.missingTitle"), t("calendar.form.missingMessage"));
      return;
    }

    setSaving(true);
    try {
      const res = await calendarApi.createEvent({
        title: trimmedTitle,
        time: trimmedTime,
        date: toEventDate(year, month, selectedDay),
      });
      setEvents((current) => [...current, res.data].sort((a, b) => a.date.localeCompare(b.date)));
      setTitle("");
      setTime("");
      setIsFormOpen(false);
    } catch (e) {
      Alert.alert(t("common.error"), t("calendar.form.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const eventDays = events.map((e) => new Date(e.date).getDate());

  const selectedDayEvents = events.filter((e) => new Date(e.date).getDate() === selectedDay);

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <DesignBackHeader title={t("calendar.title")} />

      <View style={styles.monthNav}>
        <Pressable
          onPress={() => {
            if (month === 0) {
              setMonth(11);
              setYear(year - 1);
            } else setMonth(month - 1);
          }}
        >
          <MaterialCommunityIcons color={colors.text} name="chevron-left" size={24} />
        </Pressable>
        <Text style={styles.monthTitle}>
          {monthNames[month]} {year}
        </Text>
        <Pressable
          onPress={() => {
            if (month === 11) {
              setMonth(0);
              setYear(year + 1);
            } else setMonth(month + 1);
          }}
        >
          <MaterialCommunityIcons color={colors.text} name="chevron-right" size={24} />
        </Pressable>
      </View>

      <View style={styles.dayHeaderRow}>
        {weekdays.map((d) => (
          <Text key={d} style={styles.dayHeader}>
            {d}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((day, i) => {
          const isSelected = day === selectedDay;
          const hasEvent = day !== null && eventDays.includes(day);
          return (
            <Pressable
              key={i}
              disabled={day === null}
              onPress={() => day && setSelectedDay(day)}
              style={[styles.cell, isSelected && styles.cellSelected]}
            >
              {day ? (
                <>
                  <Text style={[styles.cellText, isSelected && styles.cellTextSelected]}>{day}</Text>
                  {hasEvent ? <View style={styles.eventDot} /> : null}
                </>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.eventsTitle}>
        {t("calendar.eventsOnDay", { day: selectedDay, month: monthNames[month] })}
      </Text>

      <View style={styles.addSection}>
        <AppButton
          fullWidth
          leftIcon={<MaterialCommunityIcons color={colors.white} name="plus" size={18} />}
          onPress={() => setIsFormOpen((current) => !current)}
          title={t("calendar.form.add")}
        />
        {isFormOpen ? (
          <View style={styles.formCard}>
            <AppInput
              label={t("calendar.form.eventTitle")}
              onChangeText={setTitle}
              placeholder={t("calendar.form.eventTitlePlaceholder")}
              value={title}
            />
            <AppInput
              autoCapitalize="none"
              label={t("calendar.form.time")}
              onChangeText={setTime}
              placeholder={t("calendar.form.timePlaceholder")}
              value={time}
            />
            <View style={styles.formActions}>
              <AppButton
                loading={saving}
                onPress={handleCreateEvent}
                style={styles.actionButton}
                title={t("common.save")}
              />
              <AppButton
                onPress={() => {
                  setIsFormOpen(false);
                  setTitle("");
                  setTime("");
                }}
                style={styles.actionButton}
                title={t("common.cancel")}
                variant="secondary"
              />
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.eventsList}>
        {selectedDayEvents.length === 0 ? (
          <Text style={{ textAlign: "center", color: colors.textMuted }}>{t("calendar.noEvents")}</Text>
        ) : null}
        {selectedDayEvents.map((event) => {
          const barColor =
            event.type === "deadline"
              ? colors.warning
              : event.type === "meeting"
                ? colors.primary
                : colors.info;
          return (
            <View key={event.id} style={styles.eventRow}>
              <View style={[styles.eventBar, { backgroundColor: barColor }]} />
              <View style={styles.eventBody}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventTime}>{event.time}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  content: { paddingBottom: 100 },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  monthTitle: { ...typography.h3, color: colors.text, fontWeight: "700" },
  dayHeaderRow: {
    flexDirection: "row",
    marginBottom: spacing.sm,
  },
  dayHeader: {
    flex: 1,
    textAlign: "center",
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    marginBottom: spacing.xl,
  },
  cell: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cellSelected: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  cellText: { ...typography.bodySmall, color: colors.text },
  cellTextSelected: { color: colors.white, fontWeight: "700" },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 2,
  },
  eventsTitle: {
    ...typography.sectionTitle,
    color: colors.text,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  addSection: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  formCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    padding: spacing.md,
  },
  formActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  eventsList: { gap: spacing.sm },
  eventRow: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  eventBar: { width: 4 },
  eventBody: { flex: 1, padding: spacing.md },
  eventTitle: { ...typography.body, color: colors.text, fontWeight: "600" },
  eventTime: { ...typography.caption, color: colors.primaryLight, marginTop: 4 },
});
}
