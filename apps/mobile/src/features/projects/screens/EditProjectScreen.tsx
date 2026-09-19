import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { projectApi, type ProjectDTO } from "../../../services/api/project.api";
import { useTranslation } from "../../../shared/i18n";
import { PERMISSIONS, useCan } from "../../../shared/permissions";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import {
  AppButton,
  AppInput,
  DesignBackHeader,
  ErrorState,
  NoPermissionState,
  Screen,
  showAppAlert,
} from "../../../shared/ui";
import { useProjectStore } from "../../../store/projectStore";
import { PROJECT_TYPE_KEYS, projectTypeKeyOf, type ProjectTypeKey } from "../constants/projectTypes";

type FormState = {
  name: string;
  customerName: string;
  typeKey: ProjectTypeKey | null;
  hasInspection: boolean;
  inspectionCompany: string;
};

function formFrom(project: ProjectDTO): FormState {
  return {
    name: project.name ?? "",
    customerName: project.customerName ?? "",
    typeKey: projectTypeKeyOf(project.projectType),
    hasInspection: Boolean(project.hasInspection),
    inspectionCompany: project.inspectionCompany ?? "",
  };
}

/**
 * Proje bilgilerini düzenleme: oluşturma ekranındaki alanların aynısı.
 * İmalat kalemleri ve finans kendi ekranlarından yönetiliyor.
 */
export function EditProjectScreen() {
  const styles = useThemedStyles(createStyles);
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

  if (!canEdit) {
    return (
      <Screen>
        <NoPermissionState
          actionLabel={t("common.back")}
          onRequestAccess={() => router.back()}
          title={t("states.noPermission")}
        />
      </Screen>
    );
  }

  if (!project || !form) {
    return (
      <Screen>
        <DesignBackHeader title={t("projects.edit.title")} />
        <ErrorState
          message={loadFailed ? t("projects.detail.notFound") : t("projects.detail.loading")}
          title={loadFailed ? t("states.error") : t("states.loading")}
        />
      </Screen>
    );
  }

  const update = (patch: Partial<FormState>) => setForm((current) => (current ? { ...current, ...patch } : current));

  const original = formFrom(project);
  const isDirty =
    form.name.trim() !== original.name.trim() ||
    form.customerName.trim() !== original.customerName.trim() ||
    form.typeKey !== original.typeKey ||
    form.hasInspection !== original.hasInspection ||
    form.inspectionCompany.trim() !== original.inspectionCompany.trim();
  const isValid = form.name.trim().length > 0 && form.customerName.trim().length > 0;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProject(project.id, {
        name: form.name.trim(),
        customerName: form.customerName.trim(),
        // Tür oluşturmadaki gibi etiketle yazılıyor. Kayıtlı tür tanınmadıysa
        // ve kullanıcı yeni bir tür seçmediyse olduğu gibi bırakılır.
        projectType: form.typeKey ? t(`projects.types.${form.typeKey}`) : project.projectType ?? undefined,
        hasInspection: form.hasInspection,
        inspectionCompany: form.hasInspection ? form.inspectionCompany.trim() : "",
      });
      router.back();
    } catch {
      showAppAlert(t("common.error"), t("projects.errors.updateFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen contentContainerStyle={styles.content} scroll>
      <DesignBackHeader subtitle={project.name} title={t("projects.edit.title")} />

      <View style={styles.form}>
        <AppInput
          label={t("projects.projectName")}
          onChangeText={(name) => update({ name })}
          placeholder={t("projects.createForm.projectPlaceholder")}
          value={form.name}
        />
        <AppInput
          label={t("projects.customerName")}
          onChangeText={(customerName) => update({ customerName })}
          placeholder={t("projects.createForm.customerPlaceholder")}
          value={form.customerName}
        />

        <Text style={styles.fieldLabel}>{t("projects.projectType")}</Text>
        <View style={styles.chipRow}>
          {PROJECT_TYPE_KEYS.map((typeKey) => {
            const active = form.typeKey === typeKey;
            return (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                key={typeKey}
                onPress={() => update({ typeKey })}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {t(`projects.types.${typeKey}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.fieldLabel}>{t("projects.inspection.label")}</Text>
        <View style={styles.chipRow}>
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ selected: form.hasInspection }}
            onPress={() => update({ hasInspection: true })}
            style={[styles.chip, form.hasInspection && styles.chipActive]}
          >
            <Text style={[styles.chipText, form.hasInspection && styles.chipTextActive]}>
              {t("projects.inspection.withInspection")}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ selected: !form.hasInspection }}
            onPress={() => update({ hasInspection: false })}
            style={[styles.chip, !form.hasInspection && styles.chipActive]}
          >
            <Text style={[styles.chipText, !form.hasInspection && styles.chipTextActive]}>
              {t("projects.inspection.withoutInspection")}
            </Text>
          </Pressable>
        </View>
        {form.hasInspection ? (
          <AppInput
            label={t("projects.inspection.company")}
            onChangeText={(inspectionCompany) => update({ inspectionCompany })}
            placeholder={t("projects.inspection.companyPlaceholder")}
            value={form.inspectionCompany}
          />
        ) : null}
      </View>

      <AppButton
        disabled={!isValid || !isDirty || saving}
        fullWidth
        loading={saving}
        onPress={handleSave}
        title={t("common.save")}
      />
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    content: { paddingBottom: 100 },
    form: { gap: spacing.md, marginBottom: spacing.xl },
    fieldLabel: { ...typography.caption, color: colors.textMuted, fontWeight: "600" },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
    chip: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.full,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.card,
    },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { ...typography.caption, color: colors.textSoft, fontWeight: "600" },
    chipTextActive: { color: colors.white },
  });
}
