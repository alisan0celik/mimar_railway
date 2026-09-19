import { useRouter, useFocusEffect } from "expo-router";
import { useMemo, useState, useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ProjectActionMenu } from "../components/ProjectActionMenu";
import { ProjectCard } from "../components/ProjectCard";
import type { ProjectDTO } from "../../../services/api/project.api";
import { useTranslation } from "../../../shared/i18n";
import { PERMISSIONS, useCan } from "../../../shared/permissions";
import { type ProjectStatus } from "../../../shared/types/project.types";
import { useProjectStore } from "../../../store/projectStore";
import { spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import {
  ConfirmDialog,
  DesignEqualFilterBar,
  EmptyState,
  Screen,
  SearchInput,
  showAppAlert,
} from "../../../shared/ui";

type FilterKey = "all" | "active" | "completed";

/** Eylem menüsünün kapanma animasyonu; bitmeden ikinci pencere açılmıyor. */
const MENU_CLOSE_DELAY_MS = 350;

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
  const [deleteTarget, setDeleteTarget] = useState<ProjectDTO | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { projects, fetchProjects, updateProject, deleteProject } = useProjectStore();
  // Hook'lar koşulsuz çağrılmalı: eskiden `a || b` yazıldığı için ilki doğruyken
  // ikinci useCan hiç çağrılmıyor, hook sırası render'dan render'a değişiyordu.
  const canComplete = useCan(PERMISSIONS.PROJECT_COMPLETE);
  const canUpdate = useCan(PERMISSIONS.PROJECT_UPDATE);
  const canUpdateFinance = useCan(PERMISSIONS.FINANCE_UPDATE);
  const canCompleteProject = canComplete || canUpdate;
  // Silme projenin finans kayıtlarını da götürdüğü için sunucu finans yetkisi
  // de istiyor; menüde de aynı kural.
  const canDeleteProject = canUpdate && canUpdateFinance;

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
      showAppAlert(t("states.error"), t("projects.markCompletedError"));
    } finally {
      setCompleting(false);
    }
  }, [menuProject, t, updateProject]);

  const handleEdit = useCallback(() => {
    if (!menuProject) return;
    const projectId = menuProject.id;
    setMenuProject(null);
    router.push({ pathname: "/(main)/projects/[projectId]/edit", params: { projectId } });
  }, [menuProject, router]);

  const handleAskDelete = useCallback(() => {
    if (!menuProject) return;
    const target = menuProject;
    setMenuProject(null);
    // iOS, bir Modal kapanma animasyonundayken ikincisini göstermiyor; onay
    // penceresi menü kapandıktan sonra açılıyor.
    setTimeout(() => setDeleteTarget(target), MENU_CLOSE_DELAY_MS);
  }, [menuProject]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await deleteProject(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      setDeleteTarget(null);
      showAppAlert(t("states.error"), t("projects.errors.deleteFailed"));
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, deleteProject, t]);

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
                  canUpdate ||
                  canDeleteProject ||
                  (canCompleteProject && isActiveProject(project.status as ProjectStatus))
                }
              />
            ))
          )}
        </View>
      </Screen>

      <ProjectActionMenu
        loading={completing}
        onClose={() => setMenuProject(null)}
        onDelete={canDeleteProject ? handleAskDelete : undefined}
        onEdit={canUpdate ? handleEdit : undefined}
        onMarkCompleted={
          menuProject && canCompleteProject && isActiveProject(menuProject.status as ProjectStatus)
            ? handleMarkCompleted
            : undefined
        }
        projectName={menuProject?.name ?? ""}
        visible={menuProject !== null}
      />

      <ConfirmDialog
        confirmDestructive
        confirmLabel={t("projects.delete.confirm")}
        loading={deleting}
        message={t("projects.delete.confirmBody", { name: deleteTarget?.name ?? "" })}
        onCancel={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
        title={t("projects.delete.confirmTitle")}
        visible={deleteTarget !== null}
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
