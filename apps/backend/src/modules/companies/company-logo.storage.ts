import { BadRequestException } from "@nestjs/common";
import { mkdir, writeFile } from "fs/promises";
import { extname, join } from "path";

const MAX_LOGO_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

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

export async function saveCompanyLogo(
  companyId: string,
  file: Express.Multer.File,
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
  const filename = `${companyId}${extension}`;
  const absolutePath = join(dir, filename);

  await writeFile(absolutePath, file.buffer);

  return `/api/uploads/companies/${filename}`;
}
