import { beforeEach, describe, expect, it, vi } from "vitest";

import { AUTH_TOKEN_STORAGE_KEY } from "@/auth/storage";
import { apiRequest } from "@/lib/api/client";

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe("apiRequest authentication", () => {
  beforeEach(() => {
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, "raw-demo-token");
  });

  it("adds the stored token as a Bearer credential", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(200, { ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await apiRequest("/auth/me");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/auth/me",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer raw-demo-token",
        }),
      }),
    );
  });

  it("clears authentication when the backend returns 401", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(401, {
          error: {
            code: "AUTHENTICATION_REQUIRED",
            message: "Authentication is required.",
            field_errors: [],
            conflict: null,
          },
        }),
      ),
    );

    await expect(apiRequest("/auth/me")).rejects.toThrow(
      "Authentication is required.",
    );

    expect(window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull();
  });

  it("can defer the shared 401 side effect for rollback-first mutations", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(401, {
          error: {
            code: "AUTHENTICATION_REQUIRED",
            message: "Authentication is required.",
            field_errors: [],
            conflict: null,
          },
        }),
      ),
    );

    await expect(
      apiRequest("/projects/1/status-transitions", undefined, {
        handleUnauthorized: false,
      }),
    ).rejects.toThrow("Authentication is required.");

    expect(window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBe(
      "raw-demo-token",
    );
  });
});
