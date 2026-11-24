import axios from "axios";
import { Directory, File, Paths } from "expo-file-system";
import { useEffect, useState } from "react";

import {
  type CreateFieldReportInput,
  fieldReportsApi,
} from "../../services/api/fieldReports.api";
import { createClientId } from "../../shared/utils/id";
import { useAuthStore } from "../../store/authStore";
import { getDatabase } from "../db/database";
import { isOnline } from "../network/network-monitor";

/**
 * Sahada yazılan ve henüz gönderilmemiş saha raporları.
 *
 * Saha personeli çoğu zaman bodrumda ya da kaba inşaatta, bağlantısız. Rapor
 * önce cihaza yazılıyor, sonra bağlantı geldiğinde gönderiliyor: önce rapor,
 * ardından fotoğraflar tek tek. Rapor ve her fotoğraf uygulamanın verdiği
 * kimlikle gidiyor; gönderim yarıda kalırsa tekrarı yeni kayıt açmıyor,
 * kaldığı yerden devam ediyor.
 *
 * Fotoğraflar seçildikleri önbellek klasöründen uygulamanın kalıcı klasörüne
 * kopyalanıyor; sistem yer açmak için önbelleği boşaltırsa fotoğraf
 * kaybolmasın. Gönderim bitince kopyalar siliniyor.
 */

export type PendingPhoto = {
  clientPhotoId: string;
  uri: string;
  mimeType: string;
  uploaded: boolean;
};

export type PendingFieldReport = {
  clientId: string;
  projectId: string;
  input: Omit<CreateFieldReportInput, "clientId">;
  photos: PendingPhoto[];
  serverId: string | null;
  /** "failed": sunucu raporu reddetti; otomatik yeniden denenmez. */
  status: "pending" | "failed";
  lastError: string | null;
  createdAt: string;
};

type Row = {
  client_id: string;
  project_id: string;
  payload: string;
  photos: string;
  server_id: string | null;
  status: string;
  last_error: string | null;
  created_at: string;
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function fromRow(row: Row): PendingFieldReport {
  return {
    clientId: row.client_id,
    projectId: row.project_id,
    input: JSON.parse(row.payload),
    photos: JSON.parse(row.photos),
    serverId: row.server_id,
    status: row.status === "failed" ? "failed" : "pending",
    lastError: row.last_error,
    createdAt: row.created_at,
  };
}

function reportFolder(clientId: string): Directory {
  return new Directory(Paths.document, "field-reports", clientId);
}

function extensionFor(mimeType: string): string {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

/** Fotoğrafı kalıcı klasöre kopyalar ve yeni adresini döndürür. */
function persistPhoto(clientId: string, clientPhotoId: string, sourceUri: string, mimeType: string) {
  const folder = reportFolder(clientId);
  folder.create({ intermediates: true, idempotent: true });
  const target = new File(folder, `${clientPhotoId}.${extensionFor(mimeType)}`);
  if (target.exists) target.delete();
  new File(sourceUri).copy(target);
  return target.uri;
}

function deleteLocalFiles(clientId: string) {
  try {
    const folder = reportFolder(clientId);
    if (folder.exists) folder.delete();
  } catch {
    // Kopyalar silinemezse yer kaplamaktan başka zararı yok.
  }
}

export type NewFieldReport = {
  projectId: string;
  title?: string;
  note: string;
  latitude?: number;
  longitude?: number;
  photos: { uri: string; mimeType: string }[];
};

/**
 * Raporu kuyruğa yazar ve hemen göndermeyi dener. Bağlantı yoksa rapor
 * cihazda bekler; ekran onu "gönderilmeyi bekliyor" olarak gösterir.
 */
export async function enqueueFieldReport(report: NewFieldReport): Promise<string> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) throw new Error("Oturum yok");

  const db = await getDatabase();
  const clientId = createClientId("report");
  const input: Omit<CreateFieldReportInput, "clientId"> = {
    title: report.title?.trim() || undefined,
    note: report.note.trim(),
    latitude: report.latitude,
    longitude: report.longitude,
    observedAt: new Date().toISOString(),
  };

  // Web'de yerel veritabanı yok; rapor doğrudan gönderilir.
  if (!db) {
    const created = await fieldReportsApi.create(report.projectId, { clientId, ...input });
    for (const photo of report.photos) {
      await fieldReportsApi.uploadPhoto(report.projectId, created.id, {
        clientPhotoId: createClientId("photo"),
        ...photo,
      });
    }
    return clientId;
  }

  const photos: PendingPhoto[] = report.photos.map((photo) => {
    const clientPhotoId = createClientId("photo");
    return {
      clientPhotoId,
      uri: persistPhoto(clientId, clientPhotoId, photo.uri, photo.mimeType),
      mimeType: photo.mimeType,
      uploaded: false,
    };
  });

  await db.runAsync(
    `INSERT INTO pending_field_reports (client_id, user_id, project_id, payload, photos, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    clientId,
    userId,
    report.projectId,
    JSON.stringify(input),
    JSON.stringify(photos),
    new Date().toISOString(),
  );
  notify();
  void flushPendingFieldReports();
  return clientId;
}

export async function listPendingFieldReports(projectId: string): Promise<PendingFieldReport[]> {
  const userId = useAuthStore.getState().user?.id;
  const db = await getDatabase();
  if (!db || !userId) return [];

  const rows = await db.getAllAsync<Row>(
    `SELECT * FROM pending_field_reports WHERE user_id = ? AND project_id = ? ORDER BY created_at DESC`,
    userId,
    projectId,
  );
  return rows.map(fromRow);
}

/** Bekleyen raporu ve fotoğraf kopyalarını siler. */
export async function discardPendingFieldReport(clientId: string): Promise<void> {
  const db = await getDatabase();
  if (!db) return;
  await db.runAsync(`DELETE FROM pending_field_reports WHERE client_id = ?`, clientId);
  deleteLocalFiles(clientId);
  notify();
}

/** Reddedilmiş raporu yeniden kuyruğa alır ve göndermeyi dener. */
export async function retryPendingFieldReport(clientId: string): Promise<void> {
  const db = await getDatabase();
  if (!db) return;
  await db.runAsync(
    `UPDATE pending_field_reports SET status = 'pending', last_error = NULL WHERE client_id = ?`,
    clientId,
  );
  notify();
  void flushPendingFieldReports();
}

/**
 * Sunucunun raporu bir daha göndersek de kabul etmeyeceği durumlar (doğrulama,
 * yetki, proje silinmiş). Ağ hatası ve sunucu arızası geçici sayılır.
 */
function permanentFailure(error: unknown): string | null {
  if (!axios.isAxiosError(error) || !error.response) return null;
  const status = error.response.status;
  if (status === 401 || status >= 500) return null;
  const message = (error.response.data as { message?: unknown } | undefined)?.message;
  return Array.isArray(message) ? message.join(", ") : String(message ?? status);
}

let flushing: Promise<void> | null = null;

/** Bekleyen raporları gönderir; aynı anda tek gönderim çalışır. */
export function flushPendingFieldReports(): Promise<void> {
  if (!flushing) {
    flushing = sendPending().finally(() => {
      flushing = null;
    });
  }
  return flushing;
}

async function sendPending(): Promise<void> {
  const userId = useAuthStore.getState().user?.id;
  const db = await getDatabase();
  if (!db || !userId || !isOnline()) return;

  const rows = await db.getAllAsync<Row>(
    `SELECT * FROM pending_field_reports WHERE user_id = ? AND status = 'pending' ORDER BY created_at ASC`,
    userId,
  );

  for (const report of rows.map(fromRow)) {
    try {
      let serverId = report.serverId;
      if (!serverId) {
        const created = await fieldReportsApi.create(report.projectId, {
          clientId: report.clientId,
          ...report.input,
        });
        serverId = created.id;
        await db.runAsync(
          `UPDATE pending_field_reports SET server_id = ? WHERE client_id = ?`,
          serverId,
          report.clientId,
        );
      }

      for (const photo of report.photos) {
        if (photo.uploaded) continue;
        await fieldReportsApi.uploadPhoto(report.projectId, serverId, photo);
        photo.uploaded = true;
        // Her fotoğraftan sonra yazılıyor: bağlantı koparsa kalanlarla devam edilir.
        await db.runAsync(
          `UPDATE pending_field_reports SET photos = ? WHERE client_id = ?`,
          JSON.stringify(report.photos),
          report.clientId,
        );
      }

      await db.runAsync(`DELETE FROM pending_field_reports WHERE client_id = ?`, report.clientId);
      deleteLocalFiles(report.clientId);
      notify();
    } catch (error) {
      const reason = permanentFailure(error);
      if (reason === null) {
        // Geçici sorun: kalanlar da büyük olasılıkla başarısız olur; sonra denenir.
        notify();
        return;
      }
      await db.runAsync(
        `UPDATE pending_field_reports SET status = 'failed', last_error = ? WHERE client_id = ?`,
        reason,
        report.clientId,
      );
      notify();
    }
  }
}

/** Projenin bekleyen raporları; kuyruk her değiştiğinde yenilenir. */
export function usePendingFieldReports(projectId: string): PendingFieldReport[] {
  const [reports, setReports] = useState<PendingFieldReport[]>([]);

  useEffect(() => {
    let active = true;
    const load = () => {
      void listPendingFieldReports(projectId).then((next) => {
        if (active) setReports(next);
      });
    };
    load();
    listeners.add(load);
    return () => {
      active = false;
      listeners.delete(load);
    };
  }, [projectId]);

  return reports;
}

/** Bir gönderim bittiğinde (başarılı ya da değil) haber verir. */
export function subscribeFieldReportQueue(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
