import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import { AuthProvider } from "@/auth/auth-provider";
import { AUTH_TOKEN_STORAGE_KEY } from "@/auth/storage";
import { RoleGate } from "@/auth/role-gate";

it("shows role-scoped UI after authentication restoration", async () => {
  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, "stored-token");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        id: 1,
        email: "manager@example.com",
        role: "MANAGER",
        assignee: null,
      }),
    }),
  );

  render(
    <AuthProvider>
      <RoleGate allow={["ADMIN", "MANAGER"]}>management controls</RoleGate>
    </AuthProvider>,
  );

  expect(await screen.findByText("management controls")).toBeInTheDocument();
});
