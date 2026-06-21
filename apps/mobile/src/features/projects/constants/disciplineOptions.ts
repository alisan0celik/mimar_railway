import type { ProjectSectionType } from "../../../shared/types/project.types";

export const disciplineOptions: Array<{ key: ProjectSectionType; label: string }> = [
  { key: "architecture", label: "Mimari" },
  { key: "static", label: "Statik" },
  { key: "mechanical", label: "Mekanik" },
  { key: "electrical", label: "Elektrik" },
  { key: "map", label: "Harita" },
  { key: "geology", label: "Jeoloji" },
];
