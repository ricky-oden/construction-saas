import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProjectsPageContent } from "@/app/projects/page";

const navigation = vi.hoisted(() => ({ query: "", push: vi.fn() }));
const api = vi.hoisted(() => ({
  projects: vi.fn(),
  customers: vi.fn(),
  properties: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navigation.push }),
  useSearchParams: () => new URLSearchParams(navigation.query),
}));
vi.mock("@/auth/management-route", () => ({
  ManagementRoute: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("@/business/api", () => ({
  businessApi: {
    projects: (...args: unknown[]) => api.projects(...args),
    customers: (...args: unknown[]) => api.customers(...args),
    properties: (...args: unknown[]) => api.properties(...args),
  },
}));

const project = {
  id: 1,
  code: "PRJ-001",
  name: "Central Renovation",
  description: null,
  customer_id: 1,
  property_id: 2,
  start_date: "2026-01-01",
  end_date: "2026-01-31",
  status: "DRAFT",
  version: 1,
  is_archived: false,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

function response(
  items: object[] = [project],
  overrides: Record<string, number> = {},
) {
  return {
    items,
    page: 1,
    page_size: 20,
    total: items.length,
    total_pages: 1,
    ...overrides,
  };
}

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const view = render(
    <QueryClientProvider client={client}>
      <ProjectsPageContent />
    </QueryClientProvider>,
  );
  return { ...view, client };
}

beforeEach(() => {
  navigation.query = "";
  navigation.push.mockReset();
  api.projects.mockReset().mockResolvedValue(response());
  api.customers
    .mockReset()
    .mockResolvedValue(response([{ id: 1, code: "CUS-1", name: "Customer" }]));
  api.properties
    .mockReset()
    .mockResolvedValue(response([{ id: 2, customer_id: 1, name: "Property" }]));
});

describe("Project list search", () => {
  it("restores initial URL conditions and sends all of them to the API", async () => {
    navigation.query =
      "name=Central&status=DRAFT&customer_id=1&property_id=2&period_from=2026-01-01&" +
      "period_to=2026-01-31&sort=code&order=asc&page=2&page_size=10";
    renderPage();
    expect(await screen.findByText(/PRJ-001/)).toBeInTheDocument();
    expect(api.projects).toHaveBeenCalledWith({
      name: "Central",
      status: "DRAFT",
      customer_id: 1,
      property_id: 2,
      period_from: "2026-01-01",
      period_to: "2026-01-31",
      sort: "code",
      order: "asc",
      page: 2,
      page_size: 10,
    });
    expect(screen.getByRole("textbox", { name: "案件名" })).toHaveValue(
      "Central",
    );
  });

  it("applies text and date fields only when search is submitted", async () => {
    renderPage();
    await userEvent.type(
      screen.getByRole("textbox", { name: "案件名" }),
      "North",
    );
    await userEvent.type(screen.getByLabelText("期間開始"), "2026-02-01");
    expect(navigation.push).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "検索" }));
    expect(navigation.push).toHaveBeenCalledWith(
      expect.stringContaining("name=North&period_from=2026-02-01"),
    );
  });

  it("applies filters and sorting immediately and resets the page", async () => {
    navigation.query = "page=3";
    renderPage();
    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "状態" }),
      "DRAFT",
    );
    expect(navigation.push).toHaveBeenLastCalledWith("/projects?status=DRAFT");
    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "並び替え" }),
      "code",
    );
    expect(navigation.push).toHaveBeenLastCalledWith(
      expect.stringContaining("sort=code"),
    );
  });

  it("resets every condition", async () => {
    navigation.query = "name=Central&status=DRAFT&page=2";
    renderPage();
    await userEvent.click(
      screen.getByRole("button", { name: "条件をリセット" }),
    );
    expect(navigation.push).toHaveBeenLastCalledWith("/projects");
    expect(screen.getByRole("textbox", { name: "案件名" })).toHaveValue("");
  });

  it("moves pages through the URL", async () => {
    api.projects.mockResolvedValue(
      response([project], { total: 3, total_pages: 3 }),
    );
    renderPage();
    await screen.findByText(/PRJ-001/);
    await userEvent.click(screen.getByRole("button", { name: "次のページ" }));
    expect(navigation.push).toHaveBeenLastCalledWith("/projects?page=2");
  });

  it.each([
    ["loading", () => new Promise(() => undefined), "読み込み中"],
    ["error", () => Promise.reject(new Error("failed")), "取得できません"],
    [
      "empty",
      () => Promise.resolve(response([])),
      "表示できるデータはありません",
    ],
  ])("shows the %s state", async (_kind, implementation, expected) => {
    api.projects.mockImplementationOnce(implementation);
    renderPage();
    expect(await screen.findByText(new RegExp(expected))).toBeInTheDocument();
  });

  it("does not display a stale result while a different condition loads", async () => {
    const view = renderPage();
    expect(await screen.findByText(/Central Renovation/)).toBeInTheDocument();
    navigation.query = "name=North";
    api.projects.mockImplementationOnce(() => new Promise(() => undefined));
    view.rerender(
      <QueryClientProvider client={view.client}>
        <ProjectsPageContent />
      </QueryClientProvider>,
    );
    expect(screen.getByText(/読み込み中/)).toBeInTheDocument();
    expect(screen.queryByText(/Central Renovation/)).not.toBeInTheDocument();
  });

  it("retains URL conditions after an API failure", async () => {
    navigation.query = "name=Central&status=DRAFT";
    api.projects.mockRejectedValueOnce(new Error("failed"));
    renderPage();
    expect(await screen.findByText(/取得できません/)).toBeInTheDocument();
    expect(
      screen.getByText(/現在条件: 案件名: Central／状態: DRAFT/),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "案件名" })).toHaveValue(
      "Central",
    );
  });
});
