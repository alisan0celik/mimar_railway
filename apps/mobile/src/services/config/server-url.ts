function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export function getServerBaseUrl(): string {
  const wsUrl = process.env.EXPO_PUBLIC_WS_URL?.trim();
  if (wsUrl) return trimTrailingSlash(wsUrl);

  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim() || "http://localhost:3000/api";
  return trimTrailingSlash(apiUrl.replace(/\/api\/?$/, ""));
}
