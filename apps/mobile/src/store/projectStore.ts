import { create } from "zustand";
import { tKey } from "../shared/i18n";
import { type ProjectDTO, type CreateProjectDTO, type UpdateProjectDTO, projectApi } from "../services/api/project.api";
import { fetchProjectsWithCache } from "../offline/sync/sync-engine";
import { refreshFinance } from "./financeStore";

type ProjectStore = {
  projects: ProjectDTO[];
  loading: boolean;
  error: string | null;

  fetchProjects: () => Promise<void>;
  createProject: (payload: CreateProjectDTO) => Promise<ProjectDTO>;
  updateProject: (id: string, payload: UpdateProjectDTO) => Promise<ProjectDTO>;
  deleteProject: (id: string) => Promise<void>;
  updateSection: (projectId: string, sectionId: string, payload: { status?: string; content?: string }) => Promise<void>;
  getProject: (id: string) => ProjectDTO | undefined;
  setProjects: (projects: ProjectDTO[]) => void;
};

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  loading: false,
  error: null,

  fetchProjects: async () => {
    set({ loading: true, error: null });
    try {
      await fetchProjectsWithCache();
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message || tKey("projects.errors.loadFailed"), loading: false });
    }
  },

  setProjects: (projects) => set({ projects }),

  createProject: async (payload) => {
    set({ loading: true, error: null });
    try {
      const newProject = await projectApi.createProject(payload);
      set((state) => ({ projects: [newProject, ...state.projects], loading: false }));
      void refreshFinance({ silent: true });
      return newProject;
    } catch (err: any) {
      set({ error: err.message || tKey("projects.errors.createFailed"), loading: false });
      throw err;
    }
  },

  updateProject: async (id, payload) => {
    set({ loading: true, error: null });
    try {
      const updatedProject = await projectApi.updateProject(id, payload);
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? updatedProject : p)),
        loading: false,
      }));
      void refreshFinance({ silent: true });
      return updatedProject;
    } catch (err: any) {
      set({ error: err.message || tKey("projects.errors.updateFailed"), loading: false });
      throw err;
    }
  },

  deleteProject: async (id) => {
    set({ loading: true, error: null });
    try {
      await projectApi.deleteProject(id);
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        loading: false,
      }));
      void refreshFinance({ silent: true });
    } catch (err: any) {
      set({ error: err.message || tKey("projects.errors.deleteFailed"), loading: false });
      throw err;
    }
  },

  updateSection: async (projectId, sectionId, payload) => {
    try {
      const updatedSection = await projectApi.updateSection(projectId, sectionId, payload);
      set((state) => {
        const project = state.projects.find((p) => p.id === projectId);
        if (!project) return state;

        const updatedSections = project.sections.map((sec) =>
          sec.id === sectionId ? updatedSection : sec
        );

        return {
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, sections: updatedSections } : p
          ),
        };
      });
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  },

  getProject: (id: string) => {
    return get().projects.find((p) => p.id === id);
  },
}));
