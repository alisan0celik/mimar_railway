import type { ProjectDTO } from "../../services/api/project.api";
import { sortProjectsByNewest } from "../../shared/utils/sortProjects";
import { getDatabase } from "../db/database";

export async function saveProjects(projects: ProjectDTO[], companyId: string): Promise<void> {
  const db = await getDatabase();
  if (!db) return;

  await db.withTransactionAsync(async () => {
    await db.runAsync(`DELETE FROM cached_projects WHERE company_id = ?`, companyId);
    for (const project of projects) {
      await db.runAsync(
        `INSERT OR REPLACE INTO cached_projects (id, company_id, payload, updated_at)
         VALUES (?, ?, ?, ?)`,
        project.id,
        companyId,
        JSON.stringify(project),
        project.updatedAt,
      );
    }
  });
}

export async function getCachedProjects(companyId: string): Promise<ProjectDTO[]> {
  const db = await getDatabase();
  if (!db) return [];

  const rows = await db.getAllAsync<{ payload: string }>(
    `SELECT payload FROM cached_projects WHERE company_id = ?`,
    companyId,
  );

  // Sıra satırların `updated_at` sütunundan değil, sunucudakiyle aynı
  // kuraldan geliyor; aksi halde açılışta liste yeniden diziliyordu.
  return sortProjectsByNewest(rows.map((row) => JSON.parse(row.payload) as ProjectDTO));
}
