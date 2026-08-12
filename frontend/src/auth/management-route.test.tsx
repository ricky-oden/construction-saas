import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { expect, it, vi } from "vitest";

import { ManagementRoute } from "@/auth/management-route";

const useAuth = vi.fn();
vi.mock("@/auth/auth-provider", () => ({ useAuth: () => useAuth() }));
vi.mock("@/auth/protected-route", () => ({
  ProtectedRoute: ({ children }: { children: ReactNode }) => children,
}));

it("allows manager UI", () => {
  useAuth.mockReturnValue({ user: { role: "MANAGER" } });
  render(<ManagementRoute>management content</ManagementRoute>);
  expect(screen.getByText("management content")).toBeInTheDocument();
});

it("shows the Phase 4 member boundary", () => {
  useAuth.mockReturnValue({ user: { role: "MEMBER" } });
  render(<ManagementRoute>management content</ManagementRoute>);
  expect(screen.getByRole("alert")).toHaveTextContent("403");
  expect(screen.getByText(/担当案件参照はPhase 6/)).toBeInTheDocument();
});
