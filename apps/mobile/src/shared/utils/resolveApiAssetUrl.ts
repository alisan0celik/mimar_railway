const API_BASE = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api";

export function resolveApiAssetUrl(path: string | null | undefined): string | null {
  if (!path?.trim()) return null;
  if (/^https?:\/\//i.test(path)) return path;

  const origin = API_BASE.replace(/\/api\/?$/, "");
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}
