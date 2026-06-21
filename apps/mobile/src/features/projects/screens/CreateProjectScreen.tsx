import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useProjectStore } from "../../../store/projectStore";
import { useTranslation } from "../../../shared/i18n";
import { PERMISSIONS, useCan } from "../../../shared/permissions";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import {
  AppButton,
  AppInput,
  DesignBackHeader,
  NoPermissionState,
  Screen,
} from "../../../shared/ui";
import { disciplineOptions } from "../constants/disciplineOptions";

const PROJECT_TYPE_KEYS = ["residential", "office", "villa", "commercial", "mixed"] as const;

export function CreateProjectScreen() {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const router = useRouter();
  const canCreate = useCan(PERMISSIONS.PROJECT_CREATE);
  const { createProject, loading } = useProjectStore();
  const [step, setStep] = useState(1);

  const [projectName, setProjectName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [typeIndex, setTypeIndex] = useState(0);
  const [hasInspection, setHasInspection] = useState(true);
  const [inspectionCompany, setInspectionCompany] = useState("");
  const [disciplines, setDisciplines] = useState<string[]>(
    disciplineOptions.map((discipline) => discipline.key),
  );

  if (!canCreate) {
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

  const step1Valid = projectName.trim() && customerName.trim() && disciplines.length > 0;
  const selectedTypeKey = PROJECT_TYPE_KEYS[typeIndex];
  const selectedTypeLabel = t(`projects.types.${selectedTypeKey}`);

  const goNext = async () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      try {
        await createProject({
          name: projectName,
          customerName,
          projectType: selectedTypeLabel,
          location: "",
          description: "",
          hasInspection,
          inspectionCompany: hasInspection ? inspectionCompany.trim() : "",
          status: "planning",
        });
        router.replace("/(main)/(tabs)/projects");
      } catch (err) {
        console.error("Failed to create project", err);
      }
    }
  };

  const goBack = () => {
    if (step > 1) setStep(step - 1);
    else router.back();
  };

  const toggleDiscipline = (key: string) => {
    setDisciplines((cur) =>
      cur.includes(key) ? cur.filter((d) => d !== key) : [...cur, key],
    );
  };

  return (
    <Screen contentContainerStyle={styles.content} scroll>
      <DesignBackHeader
        onBack={goBack}
        subtitle={t("projects.step", { current: step, total: 2 })}
        title={t("projects.createTitle")}
      />

      <View style={styles.stepRow}>
        {[1, 2].map((n) => (
          <View key={n} style={styles.stepItem}>
            <View style={[styles.stepDot, n <= step && styles.stepDotActive]}>
              <Text style={[styles.stepNum, n <= step && styles.stepNumActive]}>{n}</Text>
            </View>
            {n < 2 ? (
              <View style={[styles.stepLine, n < step && styles.stepLineActive]} />
            ) : null}
          </View>
        ))}
      </View>

      {step === 1 ? (
        <View style={styles.form}>
          <AppInput
            label={t("projects.projectName")}
            onChangeText={setProjectName}
            placeholder={t("projects.createForm.projectPlaceholder")}
            value={projectName}
          />
          <AppInput
            label={t("projects.customerName")}
            onChangeText={setCustomerName}
            placeholder={t("projects.createForm.customerPlaceholder")}
            value={customerName}
          />
          <Text style={styles.fieldLabel}>{t("projects.projectType")}</Text>
          <View style={styles.chipRow}>
            {PROJECT_TYPE_KEYS.map((typeKey, idx) => (
              <Pressable
                key={typeKey}
                onPress={() => setTypeIndex(idx)}
                style={[styles.chip, typeIndex === idx && styles.chipActive]}
              >
                <Text style={[styles.chipText, typeIndex === idx && styles.chipTextActive]}>
                  {t(`projects.types.${typeKey}`)}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.fieldLabel}>{t("projects.inspection.label")}</Text>
          <View style={styles.chipRow}>
            <Pressable
              onPress={() => setHasInspection(true)}
              style={[styles.chip, hasInspection && styles.chipActive]}
            >
              <Text style={[styles.chipText, hasInspection && styles.chipTextActive]}>
                {t("projects.inspection.withInspection")}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => { setHasInspection(false); setInspectionCompany(""); }}
              style={[styles.chip, !hasInspection && styles.chipActive]}
            >
              <Text style={[styles.chipText, !hasInspection && styles.chipTextActive]}>
                {t("projects.inspection.withoutInspection")}
              </Text>
            </Pressable>
          </View>
          {hasInspection ? (
            <AppInput
              label={t("projects.inspection.company")}
              onChangeText={setInspectionCompany}
              placeholder={t("projects.inspection.companyPlaceholder")}
              value={inspectionCompany}
            />
          ) : null}
          <Text style={styles.fieldLabel}>{t("projects.disciplines.label")}</Text>
          <View style={styles.chipRow}>
            {disciplineOptions.map((d) => {
              const on = disciplines.includes(d.key);
              return (
                <Pressable
                  key={d.key}
                  onPress={() => toggleDiscipline(d.key)}
                  style={[styles.chip, on && styles.chipActive]}
                >
                  <Text style={[styles.chipText, on && styles.chipTextActive]}>
                    {t(`projects.disciplines.${d.key}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {step === 2 ? (
        <View style={styles.summaryCard}>
          <SummaryRow label={t("projects.createForm.summaryProject")} value={projectName || "—"} />
          <SummaryRow label={t("projects.createForm.summaryCustomer")} value={customerName || "—"} />
          <SummaryRow label={t("projects.createForm.summaryType")} value={selectedTypeLabel} />
          <SummaryRow
            label={t("projects.createForm.summaryInspection")}
            value={
              hasInspection
                ? inspectionCompany || t("common.notSpecified")
                : t("common.none")
            }
          />
          <SummaryRow
            label={t("projects.createForm.summaryDisciplines")}
            value={t("projects.disciplines.selectedCount", { count: disciplines.length })}
          />
        </View>
      ) : null}

      <AppButton
        disabled={(step === 1 && !step1Valid) || loading}
        fullWidth
        onPress={goNext}
        title={
          step === 2
            ? loading
              ? t("projects.creating")
              : t("projects.create")
            : t("common.continue")
        }
      />
    </Screen>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  content: { paddingBottom: 100 },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  stepItem: { flex: 1, flexDirection: "row", alignItems: "center" },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  stepNum: { ...typography.caption, color: colors.textMuted, fontWeight: "700" },
  stepNumActive: { color: colors.white },
  stepLine: { flex: 1, height: 2, backgroundColor: colors.border, marginHorizontal: 4 },
  stepLineActive: { backgroundColor: colors.primary },
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
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
  summaryLabel: { ...typography.bodySmall, color: colors.textMuted },
  summaryValue: { ...typography.body, color: colors.text, fontWeight: "600", flex: 1, textAlign: "right" },
});
}
