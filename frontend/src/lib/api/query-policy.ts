import { ApiClientError } from "@/lib/api/errors";

export function shouldRetryQuery(failureCount: number, error: Error) {
  if (
    error instanceof ApiClientError &&
    error.status >= 400 &&
    error.status < 500
  ) {
    return false;
  }
  return failureCount < 2;
}
