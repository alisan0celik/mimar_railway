import { BadRequestException } from "@nestjs/common";
import { randomBytes } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import { basename, join } from "path";

const MAX_LOGO_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const PUBLIC_PREFIX = "/api/uploads/companies/";

function uploadsRoot() {
  return join(process.env.UPLOAD_DIR || join(process.cwd(), "uploads"), "companies");
}

function extensionForMime(mimeType: string): string {
  switch (mimeType) {
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    default:
      return ".jpg";
  }
}

/**
 * Kayıtlı logo adresinden dosya yolunu çıkarır.
 *
 * Yalnızca beklenen ön ekle başlayan adresler kabul edilir ve dosya adı
 * `basename` ile sadeleştirilir; böylece adres kurcalanarak uploads klasörü
 * dışındaki bir dosya silinemez.
 */
function resolveStoredFile(logoUrl: string | null | undefined): string | null {
  if (!logoUrl || !logoUrl.startsWith(PUBLIC_PREFIX)) return null;

  const filename = basename(logoUrl.slice(PUBLIC_PREFIX.length));
  if (!filename || filename.startsWith(".")) return null;

  return join(uploadsRoot(), filename);
}

/** Eski logo dosyasını siler; yoksa sessizce geçer. */
export async function deleteCompanyLogoFile(logoUrl: string | null | undefined): Promise<void> {
  const path = resolveStoredFile(logoUrl);
  if (!path) return;

  try {
    await unlink(path);
  } catch {
    // Dosya zaten yoksa sorun değil
  }
}

/**
 * Yeni logoyu kaydeder ve adresini döndürür.
 *
 * Dosya adı her yüklemede değişir. Sabit ad (`<şirketId>.png`) kullanıldığında
 * adres de sabit kalıyordu; uygulama görseli adrese göre önbelleklediği için
 * logo değiştirilse bile ekranda eskisi görünüyordu.
 */
export async function saveCompanyLogo(
  companyId: string,
  file: Express.Multer.File,
  previousLogoUrl?: string | null,
): Promise<string> {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    throw new BadRequestException("Logo yalnızca PNG, JPG veya WEBP olabilir");
  }

  if (file.size > MAX_LOGO_SIZE) {
    throw new BadRequestException("Logo en fazla 5MB olabilir");
  }

  const dir = uploadsRoot();
  await mkdir(dir, { recursive: true });

  const extension = extensionForMime(file.mimetype);
  const filename = `${companyId}-${randomBytes(6).toString("hex")}${extension}`;

  await writeFile(join(dir, filename), file.buffer);

  // Yeni dosya yazıldıktan sonra eskisi silinir; sıra tersine olursa
  // yazma hatasında şirket logosuz kalırdı.
  await deleteCompanyLogoFile(previousLogoUrl);

  return `${PUBLIC_PREFIX}${filename}`;
}
