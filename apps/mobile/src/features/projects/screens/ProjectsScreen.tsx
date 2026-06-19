import { useRouter, useFocusEffect } from "expo-router";
import { useMemo, useState, useCallback } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { ProjectActionMenu } from "../components/ProjectActionMenu";
import { ProjectCard } from "../components/ProjectCard";
import type { ProjectDTO } from "../../../services/api/project.api";
import { useTranslation } from "../../../shared/i18n";
import { PERMISSIONS, useCan } from "../../../shared/permissions";
import { type ProjectStatus } from "../../../shared/types/project.types";
import { useProjectStore } from "../../../store/projectStore";
import { spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { DesignEqualFilterBar, EmptyState, Screen, SearchInput } from "../../../shared/ui";

type FilterKey = "all" | "active" | "completed";

function statusMatches(status: ProjectStatus, filter: FilterKey): boolean {
  if (filter === "all") return true;
  if (filter === "active") return status === "active" || status === "planning" || status === "waiting";
  return status === "completed";
}

function isActiveProject(status: ProjectStatus): boolean {
  return status === "active" || status === "planning" || status === "waiting";
}

export function ProjectsScreen() {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [menuProject, setMenuProject] = useState<ProjectDTO | null>(null);
  const [completing, setCompleting] = useState(false);
  const { projects, fetchProjects, updateProject } = useProjectStore();
  const canCompleteProject =
    useCan(PERMISSIONS.PROJECT_COMPLETE) || useCan(PERMISSIONS.PROJECT_UPDATE);

  useFocusEffect(
    useCallback(() => {
      fetchProjects();
    }, [fetchProjects]),
  );

  const filters = useMemo(
    () => [
      { key: "all", label: t("common.all") },
      { key: "active", label: t("filters.ongoing") },
      { key: "completed", label: t("status.completed") },
    ],
    [t],
  );

  const filteredProjects = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    return projects.filter((project) => {
      if (!statusMatches(project.status as ProjectStatus, activeFilter)) return false;
      if (!q) return true;
      return `${project.name} ${project.customerName || ""} ${project.createdBy?.fullName || ""}`
        .toLowerCase()
        .includes(q);
    });
  }, [activeFilter, searchValue, projects]);

  const handleMarkCompleted = useCallback(async () => {
    if (!menuProject) return;

    setCompleting(true);
    try {
      await updateProject(menuProject.id, { status: "completed" });
      setMenuProject(null);
    } catch {
      Alert.alert(t("states.error"), t("projects.markCompletedError"));
    } finally {
      setCompleting(false);
    }
  }, [menuProject, t, updateProject]);

  return (
    <>
      <Screen contentContainerStyle={styles.content} scroll>
        <Text style={styles.pageTitle}>{t("projects.title")}</Text>

        <SearchInput
          containerStyle={styles.search}
          onChangeText={setSearchValue}
          placeholder={t("projects.searchPlaceholder")}
          showClearButton={false}
          value={searchValue}
        />

        <DesignEqualFilterBar
          activeKey={activeFilter}
          onChange={(key) => setActiveFilter(key as FilterKey)}
          tabs={filters}
        />

        <View>
          {filteredProjects.length === 0 ? (
            <EmptyState description={t("common.noDataDesc")} title={t("common.noData")} />
          ) : (
            filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                onMenuPress={() => setMenuProject(project)}
                onPress={() =>
                  router.push({
                    pathname: "/(main)/projects/[projectId]",
                    params: { projectId: project.id },
                  })
                }
                project={project}
                showMenu={
                  canCompleteProject && isActiveProject(project.status as ProjectStatus)
                }
              />
            ))
          )}
        </View>
      </Screen>

      <ProjectActionMenu
        loading={completing}
        onClose={() => setMenuProject(null)}
        onMarkCompleted={handleMarkCompleted}
        projectName={menuProject?.name ?? ""}
        visible={menuProject !== null}
      />
    </>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    content: { paddingBottom: 100 },
    pageTitle: {
      fontSize: 28,
      lineHeight: 34,
      color: colors.text,
      fontWeight: "700",
      marginBottom: spacing.lg,
    },
    search: {
      borderRadius: 14,
      marginBottom: spacing.md,
      backgroundColor: colors.surfaceMuted,
      borderColor: "transparent",
    },
  });
}
