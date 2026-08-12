import { ApiClientError, type ApiErrorResponse } from "@/lib/api/errors";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8002/api/v1";

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const errorResponse = (await response.json()) as ApiErrorResponse;
    throw new ApiClientError(response.status, errorResponse);
  }

  return (await response.json()) as T;
}
