import type { UserDTO } from "@mimar/shared";
import axios from "axios";

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) {
      return message.join("\n");
    }
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

export type CompanyLogoAsset = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
};

export function buildLogoFormData(asset: CompanyLogoAsset): FormData {
  const formData = new FormData();
  const extension =
    asset.mimeType === "image/png"
      ? "png"
      : asset.mimeType === "image/webp"
        ? "webp"
        : "jpg";

  formData.append("logo", {
    uri: asset.uri,
    type: asset.mimeType || "image/jpeg",
    name: asset.fileName || `company-logo.${extension}`,
  } as unknown as Blob);

  return formData;
}

export type CreateCompanyResponse = {
  id: string;
  name: string;
  accessToken: string;
  refreshToken: string;
  user: UserDTO;
};
