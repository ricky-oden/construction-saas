import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";

import { AuthProvider, useAuth } from "@/auth/auth-provider";
import { AUTH_TOKEN_STORAGE_KEY } from "@/auth/storage";

const user = {
  id: 1,
  email: "admin@example.com",
  role: "ADMIN" as const,
  assignee: null,
};

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

function AuthHarness() {
  const auth = useAuth();
  return (
    <div>
      <p>{auth.status}</p>
      <p>{auth.user?.email}</p>
      <button onClick={() => void auth.logout()}>logout</button>
    </div>
  );
}

it("restores the authenticated user from a stored token", async () => {
  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, "stored-token");
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, user)));

  render(
    <AuthProvider>
      <AuthHarness />
    </AuthProvider>,
  );

  expect(screen.getByText("loading")).toBeInTheDocument();
  expect(await screen.findByText("admin@example.com")).toBeInTheDocument();
  expect(screen.getByText("authenticated")).toBeInTheDocument();
});

it("revokes through the API and clears local authentication on logout", async () => {
  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, "stored-token");
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(jsonResponse(200, user))
    .mockResolvedValueOnce(jsonResponse(200, { status: "logged_out" }));
  vi.stubGlobal("fetch", fetchMock);

  render(
    <AuthProvider>
      <AuthHarness />
    </AuthProvider>,
  );
  await screen.findByText("admin@example.com");
  await userEvent.click(screen.getByRole("button", { name: "logout" }));

  await waitFor(() =>
    expect(screen.getByText("unauthenticated")).toBeInTheDocument(),
  );
  expect(window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull();
  expect(fetchMock).toHaveBeenLastCalledWith(
    "/api/v1/auth/logout",
    expect.objectContaining({ method: "POST" }),
  );
});
