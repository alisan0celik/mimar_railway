import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { projectApi, type ProjectDTO } from "../../../services/api/project.api";
import { useTranslation } from "../../../shared/i18n";
import { PERMISSIONS, useCan } from "../../../shared/permissions";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import {
  AppButton,
  AppInput,
  DatePickerSheet,
  DesignBackHeader,
  ErrorState,
  Screen,
  showAppAlert,
} from "../../../shared/ui";
import { useProjectStore } from "../../../store/projectStore";
import { TourTarget, useScreenTour } from "../../guide";
import { DeadlineBadge } from "../components/DeadlineBadge";
import {
  calendarDate,
  contractDeadline,
  deadlineStatus,
  formatCalendarDate,
} from "../utils/contractDeadline";

const MAX_DAYS = 36500;

type DateField =
  | "contractDate"
  | "siteDeliveryDate"
  | "provisionalAcceptanceDate"
  | "finalAcceptanceDate";

type FormState = {
  tenderNumber: string;
  contractDate: string | null;
  siteDeliveryDate: string | null;
  workDurationDays: string;
  extensionDays: string;
  provisionalAcceptanceDate: string | null;
  finalAcceptanceDate: string | null;
};

function formFrom(project: ProjectDTO): FormState {
  return {
    tenderNumber: project.tenderNumber ?? "",
    contractDate: calendarDate(project.contractDate),
    siteDeliveryDate: calendarDate(project.siteDeliveryDate),
    workDurationDays: project.workDurationDays != null ? String(project.workDurationDays) : "",
    extensionDays: project.extensionDays != null ? String(project.extensionDays) : "",
    provisionalAcceptanceDate: calendarDate(project.provisionalAcceptanceDate),
    finalAcceptanceDate: calendarDate(project.finalAcceptanceDate),
  };
}

/** Boş alan `null`; geçersizse `undefined` döner ve kayıt engellenir. */
function parseDays(value: string): number | null | undefined {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^\d+$/.test(trimmed)) return undefined;
  const days = Number(trimmed);
  return days <= MAX_DAYS ? days : undefined;
}

/**
 * Projenin kamu ihalesi bilgileri (belediye modu).
 *
 * İş bitim tarihi kullanıcıdan alınmıyor, yer teslim tarihi, iş süresi ve
 * süre uzatımlarından hesaplanıyor; uzatım verildikçe bitim tarihi kendiliğinden
 * ilerliyor. Proje düzenleme yetkisi olmayanlar bilgileri yalnızca görür.
 */
export function TenderInfoScreen() {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();
  const router = useRouter();
  const canEdit = useCan(PERMISSIONS.PROJECT_UPDATE);
  const params = useLocalSearchParams<{ projectId?: string }>();
  const projectId = params.projectId ?? "";
  const { projects, updateProject } = useProjectStore();

  const [project, setProject] = useState<ProjectDTO | null>(
    () => projects.find((item) => item.id === projectId) ?? null,
  );
  const [loadFailed, setLoadFailed] = useState(false);
  const [form, setForm] = useState<FormState | null>(() => (project ? formFrom(project) : null));
  const [picking, setPicking] = useState<DateField | null>(null);
  const [saving, setSaving] = useState(false);

  // Listeden gelinmediyse (ör. bildirimden) proje sunucudan okunur.
  useEffect(() => {
    if (project || !projectId) return;
    projectApi
      .getProject(projectId)
      .then((loaded) => {
        setProject(loaded);
        setForm(formFrom(loaded));
      })
      .catch(() => setLoadFailed(true));
  }, [project, projectId]);

  const durationDays = form ? parseDays(form.workDurationDays) : null;
  const extensionDays = form ? parseDays(form.extensionDays) : null;
  const daysInvalid = durationDays === undefined || extensionDays === undefined;

  // Önizleme, kaydedilmemiş değerlerle anında güncelleniyor.
  const preview = useMemo(() => {
    if (!form) return null;
    const dates = {
      siteDeliveryDate: form.siteDeliveryDate,
      workDurationDays: durationDays ?? null,
      extensionDays: extensionDays ?? null,
      provisionalAcceptanceDate: form.provisionalAcceptanceDate,
    };
    return { deadline: contractDeadline(dates), status: deadlineStatus(dates) };
  }, [form, durationDays, extensionDays]);

  // Tur, hedefleri çizilince (proje yüklenince) başlar.
  useScreenTour("tender", { enabled: Boolean(project && form) });

  if (!project || !form || !preview) {
    return (
      <Screen>
        <DesignBackHeader title={t("projects.tender.title")} />
        <ErrorState
          message={loadFailed ? t("projects.detail.notFound") : t("projects.detail.loading")}
          title={loadFailed ? t("states.error") : t("states.loading")}
        />
      </Screen>
    );
  }

  const update = (patch: Partial<FormState>) =>
    setForm((current) => (current ? { ...current, ...patch } : current));

  const original = formFrom(project);
  const isDirty = (Object.keys(form) as (keyof FormState)[]).some(
    (key) => (form[key] ?? "").toString().trim() !== (original[key] ?? "").toString().trim(),
  );

  const handleSave = async () => {
    if (daysInvalid) return;
    setSaving(true);
    try {
      const updated = await updateProject(project.id, {
        tenderNumber: form.tenderNumber.trim() || null,
        contractDate: form.contractDate,
        siteDeliveryDate: form.siteDeliveryDate,
        workDurationDays: durationDays ?? null,
        extensionDays: extensionDays ?? null,
        provisionalAcceptanceDate: form.provisionalAcceptanceDate,
        finalAcceptanceDate: form.finalAcceptanceDate,
      });
      setProject(updated);
      setForm(formFrom(updated));
      router.back();
    } catch {
      showAppAlert(t("common.error"), t("projects.tender.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const renderDateField = (field: DateField) => {
    const value = form[field];
    return (
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>{t(`projects.tender.${field}`)}</Text>
        <Pressable
          accessibilityRole="button"
          disabled={!canEdit}
          onPress={() => setPicking(field)}
          style={[styles.dateInput, !canEdit && styles.dateInputReadOnly]}
        >
          <Text style={value ? styles.dateValue : styles.datePlaceholder}>
            {value
              ? formatCalendarDate(value, t)
              : canEdit
                ? t("projects.tender.selectDate")
                : t("projects.tender.notEntered")}
          </Text>
          {canEdit ? (
            <MaterialCommunityIcons color={colors.textMuted} name="calendar-month-outline" size={20} />
          ) : null}
        </Pressable>
      </View>
    );
  };

  return (
    <Screen contentContainerStyle={styles.content} scroll>
      <DesignBackHeader subtitle={project.name} title={t("projects.tender.title")} />

      <TourTarget id="tender.deadline">
        <View collapsable={false} style={styles.deadlineCard}>
          <Text style={styles.deadlineLabel}>{t("projects.tender.deadline")}</Text>
          {preview.deadline ? (
            <>
              <Text style={styles.deadlineValue}>{formatCalendarDate(preview.deadline, t)}</Text>
              <DeadlineBadge status={preview.status} />
              <Text style={styles.hint}>{t("projects.tender.deadlineHint")}</Text>
            </>
          ) : (
            <Text style={styles.hint}>{t("projects.tender.deadlineUnknown")}</Text>
          )}
        </View>
      </TourTarget>

      {!canEdit ? <Text style={styles.readOnly}>{t("projects.tender.readOnly")}</Text> : null}

      <Text style={styles.sectionTitle}>{t("projects.tender.sectionContract")}</Text>
      <AppInput
        autoCapitalize="none"
        editable={canEdit}
        label={t("projects.tender.tenderNumber")}
        onChangeText={(tenderNumber) => update({ tenderNumber })}
        placeholder={t("projects.tender.tenderNumberPlaceholder")}
        value={form.tenderNumber}
      />
      {renderDateField("contractDate")}

      <Text style={styles.sectionTitle}>{t("projects.tender.sectionSchedule")}</Text>
      {renderDateField("siteDeliveryDate")}
      <AppInput
        editable={canEdit}
        error={durationDays === undefined ? t("projects.tender.invalidDays") : undefined}
        keyboardType="number-pad"
        label={t("projects.tender.workDurationDays")}
        onChangeText={(workDurationDays) => update({ workDurationDays })}
        placeholder="0"
        value={form.workDurationDays}
      />
      <TourTarget id="tender.extension">
        <View collapsable={false}>
          <AppInput
            editable={canEdit}
            error={extensionDays === undefined ? t("projects.tender.invalidDays") : undefined}
            helperText={t("projects.tender.extensionHint")}
            keyboardType="number-pad"
            label={t("projects.tender.extensionDays")}
            onChangeText={(value) => update({ extensionDays: value })}
            placeholder="0"
            value={form.extensionDays}
          />
        </View>
      </TourTarget>

      <Text style={styles.sectionTitle}>{t("projects.tender.sectionAcceptance")}</Text>
      {renderDateField("provisionalAcceptanceDate")}
      {renderDateField("finalAcceptanceDate")}

      {canEdit ? (
        <AppButton
          disabled={!isDirty || daysInvalid || saving}
          fullWidth
          loading={saving}
          onPress={handleSave}
          style={styles.saveBtn}
          title={t("common.save")}
        />
      ) : null}

      <DatePickerSheet
        allowClear
        onCancel={() => setPicking(null)}
        onConfirm={(value) => {
          if (picking) update({ [picking]: value } as Partial<FormState>);
          setPicking(null);
        }}
        title={picking ? t(`projects.tender.${picking}`) : ""}
        value={picking ? form[picking] : null}
        visible={picking !== null}
      />
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    content: { paddingBottom: 100, gap: spacing.md },
    deadlineCard: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    deadlineLabel: { ...typography.caption, color: colors.textMuted, fontWeight: "600" },
    deadlineValue: { ...typography.h3, color: colors.text, fontWeight: "700" },
    hint: { ...typography.caption, color: colors.textMuted, lineHeight: 18 },
    readOnly: { ...typography.caption, color: colors.warning },
    sectionTitle: {
      ...typography.body,
      color: colors.text,
      fontWeight: "700",
      marginTop: spacing.sm,
    },
    // Tarih alanları AppInput'la yan yana duruyor; etiket ve kutu onunla aynı.
    field: {},
    fieldLabel: { ...typography.label, color: colors.textSoft, marginBottom: spacing.sm },
    dateInput: {
      minHeight: 52,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.input,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
    },
    dateInputReadOnly: { opacity: 0.65 },
    dateValue: { ...typography.body, color: colors.text },
    datePlaceholder: { ...typography.body, color: colors.textDisabled },
    saveBtn: { marginTop: spacing.md },
  });
}
