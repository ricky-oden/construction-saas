import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, expect, it, vi } from "vitest";

import AssigneesPage from "@/app/assignees/page";
import { businessKeys } from "@/business/query-keys";

const api = vi.hoisted(() => ({ list: vi.fn(), write: vi.fn() }));
vi.mock("@/auth/management-route", () => ({
  ManagementRoute: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("@/business/api", () => ({
  businessApi: { assignees: (...args: unknown[]) => api.list(...args) },
  writeBusiness: (...args: unknown[]) => api.write(...args),
}));

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <AssigneesPage />
    </QueryClientProvider>,
  );
  return client;
}

beforeEach(() => {
  api.list.mockReset().mockResolvedValue({
    items: [{ id: 1, display_name: "Demo Member", is_active: true }],
  });
  api.write.mockReset();
});

it("registers an assignee with React Hook Form and refreshes the list", async () => {
  api.write.mockResolvedValue({ id: 2, display_name: "New", is_active: true });
  const client = renderPage();
  const invalidate = vi.spyOn(client, "invalidateQueries");
  await screen.findByDisplayValue("Demo Member");
  await userEvent.type(screen.getByLabelText("ユーザーID"), "12");
  await userEvent.type(screen.getAllByLabelText("表示名")[0], "New");
  await userEvent.click(screen.getByRole("button", { name: "担当者を登録" }));
  await waitFor(() =>
    expect(api.write).toHaveBeenCalledWith("/assignees", "POST", {
      user_id: 12,
      display_name: "New",
    }),
  );
  expect(invalidate).toHaveBeenCalledWith({
    queryKey: businessKeys.assignees.all,
  });
});

it("updates display name and active state without physical deletion", async () => {
  api.write.mockResolvedValue({
    id: 1,
    display_name: "Updated",
    is_active: false,
  });
  renderPage();
  const name = await screen.findByDisplayValue("Demo Member");
  await userEvent.clear(name);
  await userEvent.type(name, "Updated");
  await userEvent.click(screen.getByRole("checkbox", { name: "有効" }));
  await userEvent.click(screen.getByRole("button", { name: "担当者を更新" }));
  await waitFor(() =>
    expect(api.write).toHaveBeenCalledWith("/assignees/1", "PATCH", {
      display_name: "Updated",
      is_active: false,
    }),
  );
});
