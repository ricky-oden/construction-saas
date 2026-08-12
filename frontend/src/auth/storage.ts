export const AUTH_TOKEN_STORAGE_KEY = "construction-v1.auth-token";
export const AUTH_CLEARED_EVENT = "construction-v1:auth-cleared";

export function getStoredToken(): string | null {
  return typeof window === "undefined"
    ? null
    : window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function storeToken(token: string): void {
  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

export function clearStoredToken(notify = true): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  if (notify) window.dispatchEvent(new Event(AUTH_CLEARED_EVENT));
}
