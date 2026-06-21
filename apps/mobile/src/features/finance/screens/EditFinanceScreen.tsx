import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { financeApi } from "../../../services/api/finance.api";
import { useTranslation } from "../../../shared/i18n";
import { useFinanceStore } from "../../../store/financeStore";
import { useProjectStore } from "../../../store/projectStore";
import { syncFinanceSummaries } from "../utils/syncFinanceSummaries";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { AppButton, AppInput, DesignBackHeader, Screen } from "../../../shared/ui";

type EditFinanceScreenProps = {
  projectId?: string;
};

export function EditFinanceScreen({ projectId }: EditFinanceScreenProps) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const router = useRouter();
  const summaries = useFinanceStore((s) => s.summaries);
  const fetchSummaries = useFinanceStore((s) => s.fetchSummaries);
  const { projects, fetchProjects } = useProjectStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSummaries({ silent: true });
    fetchProjects();
  }, [fetchSummaries, fetchProjects]);

  const existing = projectId ? summaries.find((r) => r.projectId === projectId) : undefined;
  const isEditing = !!existing;

  const [selectedProjectId, setSelectedProjectId] = useState(projectId ?? "");
  const [agreedAmount, setAgreedAmount] = useState(existing ? String(existing.agreedAmount) : "");
  const [showProjectList, setShowProjectList] = useState(false);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const isValid = selectedProjectId.trim().length > 0 && agreedAmount.trim().length > 0;

  const handleSave = async () => {
    if (!selectedProjectId || !agreedAmount.trim()) return;

    setLoading(true);
    try {
      const { data } = await financeApi.updateProjectBudget(
        selectedProjectId,
        Number(agreedAmount),
      );
      await syncFinanceSummaries(data.summary);

      const projectName = selectedProject?.name || selectedProjectId;
      router.replace({
        pathname: "/(main)/finance/success",
        params: {
          title: isEditing ? t("finance.success.financeUpdated") : t("finance.success.financeCreated"),
          subtitle: isEditing
            ? t("finance.success.budgetUpdated")
            : t("finance.success.agreementCreated"),
          backRoute: "/(main)/(tabs)/finance",
        },
      });
    } catch (error) {
      Alert.alert(t("common.error"), t("finance.edit.updateError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <DesignBackHeader
        title={isEditing ? t("finance.edit.title") : t("finance.edit.createTitle")}
        subtitle={t("finance.edit.subtitle")}
      />

      <View style={styles.form}>
        <Text style={styles.fieldLabel}>{t("finance.edit.selectProject")}</Text>
        <Pressable
          onPress={() => setShowProjectList(!showProjectList)}
          style={styles.selectField}
        >
          <Text style={selectedProject ? styles.selectValue : styles.selectPlaceholder}>
            {selectedProject ? selectedProject.name : t("finance.edit.selectProjectPlaceholder")}
          </Text>
          <Text style={styles.selectArrow}>{showProjectList ? "▲" : "▼"}</Text>
        </Pressable>

        {showProjectList && (
          <View style={styles.projectList}>
            {projects.map((p) => {
              const isSelected = p.id === selectedProjectId;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => {
                    setSelectedProjectId(p.id);
                    setShowProjectList(false);
                  }}
                  style={[styles.projectItem, isSelected && styles.projectItemActive]}
                >
                  <Text style={[styles.projectItemText, isSelected && styles.projectItemTextActive]}>
                    {p.name}
                  </Text>
                  {isSelected ? <Text style={styles.checkMark}>✓</Text> : null}
                </Pressable>
              );
            })}
          </View>
        )}

        <AppInput
          keyboardType="numeric"
          label={t("finance.edit.agreedAmountLabel")}
          onChangeText={setAgreedAmount}
          placeholder="0"
          value={agreedAmount}
        />

        <AppButton
          disabled={!isValid || loading}
          fullWidth
          onPress={handleSave}
          title={isEditing ? t("common.update") : t("common.save")}
          loading={loading}
        />
      </View>
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  content: { paddingBottom: 100 },
  form: { gap: spacing.md },
  fieldLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  selectField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  selectPlaceholder: {
    ...typography.body,
    color: colors.textDisabled,
  },
  selectValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: "600",
  },
  selectArrow: {
    fontSize: 12,
    color: colors.textMuted,
  },
  projectList: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  projectItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  projectItemActive: {
    backgroundColor: `${colors.primary}18`,
  },
  projectItemText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  projectItemTextActive: {
    color: colors.primary,
    fontWeight: "600",
  },
  checkMark: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 16,
    marginLeft: spacing.sm,
  },
});
}
