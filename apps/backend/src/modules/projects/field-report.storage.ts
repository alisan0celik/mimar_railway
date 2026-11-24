import { BadRequestException } from "@nestjs/common";
import { randomBytes } from "crypto";
import { mkdir, rm, writeFile } from "fs/promises";
import { basename, join } from "path";

/**
 * Saha raporu fotoğraflarının diskteki yeri.
 *
 * `uploads/field-reports/<şirket>/<proje>/<rapor>/` altında tutulur. Bu klasör
 * herkese açık statik sunumun dışında: fotoğraflar yalnızca şirketin yetkili
 * kullanıcılarına, yetki kontrolünden geçen uç üzerinden verilir. Klasör
 * `uploads` altında kaldığı için günlük yedeğe de girer. Proje silinince
 * proje klasörü bütünüyle kaldırılır.
 */

export const MAX_PHOTO_SIZE = 10 * 1024 * 1024;

const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;

/** Dosya türü istemcinin söylediğine göre değil, dosyanın ilk baytlarına göre belirlenir. */
function detectImageType(buffer: Buffer): { mimeType: string; extension: string } | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mimeType: "image/jpeg", extension: ".jpg" };
  }
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return { mimeType: "image/png", extension: ".png" };
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { mimeType: "image/webp", extension: ".webp" };
  }
  return null;
}

function root(): string {
  return join(process.env.UPLOAD_DIR || join(process.cwd(), "uploads"), "field-reports");
}

/** Kimlikler veritabanından gelse de yol parçası yapılmadan önce doğrulanır. */
function segment(id: string): string {
  if (!SAFE_ID.test(id)) throw new BadRequestException("Geçersiz kimlik");
  return id;
}

export function projectDir(companyId: string, projectId: string): string {
  return join(root(), segment(companyId), segment(projectId));
}

export function reportDir(companyId: string, projectId: string, reportId: string): string {
  return join(projectDir(companyId, projectId), segment(reportId));
}

export function photoPath(dir: string, fileName: string): string {
  return join(dir, basename(fileName));
}

/** Fotoğrafı doğrular, kaydeder ve veritabanına yazılacak bilgileri döndürür. */
export async function savePhoto(
  dir: string,
  file: { buffer: Buffer; size: number } | undefined,
): Promise<{ fileName: string; mimeType: string; size: number }> {
  if (!file?.buffer?.length) {
    throw new BadRequestException("Fotoğraf gönderilmedi");
  }
  if (file.size > MAX_PHOTO_SIZE) {
    throw new BadRequestException("Fotoğraf en fazla 10 MB olabilir");
  }

  const type = detectImageType(file.buffer);
  if (!type) {
    throw new BadRequestException("Fotoğraf yalnızca JPG, PNG veya WEBP olabilir");
  }

  await mkdir(dir, { recursive: true });
  const fileName = `${randomBytes(12).toString("hex")}${type.extension}`;
  await writeFile(join(dir, fileName), file.buffer);

  return { fileName, mimeType: type.mimeType, size: file.size };
}

/** Klasörü ve içindekileri siler; yoksa sessizce geçer. */
export async function removeDir(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true });
}

/** Tek bir dosyayı siler; yoksa sessizce geçer. */
export async function removeFile(path: string): Promise<void> {
  await rm(path, { force: true });
}
