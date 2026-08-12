import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

import { AuthProvider } from "@/auth/auth-provider";
import { ProtectedRoute } from "@/auth/protected-route";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/account",
  useRouter: () => ({ replace }),
}));

beforeEach(() => replace.mockReset());

it("keeps the requested path when redirecting an unauthenticated user", async () => {
  render(
    <AuthProvider>
      <ProtectedRoute>secret content</ProtectedRoute>
    </AuthProvider>,
  );

  expect(screen.queryByText("secret content")).not.toBeInTheDocument();
  await waitFor(() =>
    expect(replace).toHaveBeenCalledWith("/login?next=%2Faccount"),
  );
});
