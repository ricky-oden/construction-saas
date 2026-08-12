import { ApiClientError } from "@/lib/api/errors";

export function formErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) return error.response.error.message;
  return error instanceof Error ? error.message : "保存に失敗しました。";
}
