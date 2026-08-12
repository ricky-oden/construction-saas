import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { expect, it, vi } from "vitest";

import CustomersPage from "./page";

const customers = vi.fn();
vi.mock("@/auth/management-route", () => ({
  ManagementRoute: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("@/business/api", () => ({
  businessApi: { customers: () => customers() },
}));

function renderPage() {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <CustomersPage />
    </QueryClientProvider>,
  );
}

it("shows the business-list loading state", () => {
  customers.mockImplementationOnce(() => new Promise(() => undefined));
  renderPage();
  expect(screen.getByRole("status")).toHaveTextContent("読み込み中");
});

it("shows the business-list error state", async () => {
  customers.mockImplementationOnce(() => Promise.reject(new Error("failed")));
  renderPage();
  expect(await screen.findByRole("alert")).toHaveTextContent("取得できません");
});

it("shows the business-list empty state", async () => {
  customers.mockImplementationOnce(() => Promise.resolve({ items: [] }));
  renderPage();
  expect(
    await screen.findByText("表示できるデータはありません。"),
  ).toBeInTheDocument();
});
