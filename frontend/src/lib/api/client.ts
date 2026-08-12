import { ApiClientError, type ApiErrorResponse } from "@/lib/api/errors";
import { clearStoredToken, getStoredToken } from "@/auth/storage";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1";

export type ApiRequestOptions = {
  handleUnauthorized?: boolean;
};

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
  options: ApiRequestOptions = {},
): Promise<T> {
  const token = getStoredToken();
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const errorResponse = (await response.json()) as ApiErrorResponse;
    if (response.status === 401 && options.handleUnauthorized !== false) {
      clearStoredToken();
    }
    throw new ApiClientError(response.status, errorResponse);
  }

  return (await response.json()) as T;
}
