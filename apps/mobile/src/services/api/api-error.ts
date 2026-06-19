import axios from "axios";

type ApiErrorBody = {
  message?: string | string[];
};

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const body = error.response?.data as ApiErrorBody | undefined;
  if (Array.isArray(body?.message)) {
    return body.message.join("\n");
  }
  if (typeof body?.message === "string" && body.message.trim().length > 0) {
    return body.message;
  }

  return fallback;
}

export function unwrapApiData<T>(payload: unknown): T {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    "statusCode" in payload &&
    "message" in payload
  ) {
    return (payload as { data: T }).data;
  }

  return payload as T;
}
