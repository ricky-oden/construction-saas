import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SchedulePageContent } from "@/app/schedule/page";

const navigation = vi.hoisted(() => ({ query: "", push: vi.fn() }));
const api = vi.hoisted(() => ({ ganttProjects: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navigation.push }),
  useSearchParams: () => new URLSearchParams(navigation.query),
}));
vi.mock("@/auth/protected-route", () => ({
  ProtectedRoute: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("@/business/api", () => ({
  businessApi: {
    ganttProjects: (...args: unknown[]) => api.ganttProjects(...args),
  },
}));

const project = {
  id: 7,
  code: "G-007",
  name: "境界案件",
  start_date: "2026-01-01",
  end_date: "2026-01-04",
  status: "PLANNED",
  version: 2,
};

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <SchedulePageContent />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  navigation.query = "mode=week&anchor=2026-01-01";
  navigation.push.mockReset();
  api.ganttProjects.mockReset().mockResolvedValue([project]);
});

describe("Schedule page", () => {
  it("restores the URL range and renders status and detail links", async () => {
    renderPage();
    expect((await screen.findAllByText("境界案件")).length).toBe(2);
    expect(api.ganttProjects).toHaveBeenCalledWith("2025-12-29", "2026-01-04");
    expect(screen.getByText("PLANNED")).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /境界案件/ })[0],
    ).toHaveAttribute("href", "/projects/7");
  });

  it("switches mode and moves the anchor through URL state", async () => {
    renderPage();
    await screen.findAllByText("境界案件");
    await userEvent.click(screen.getByRole("button", { name: "月表示" }));
    expect(navigation.push).toHaveBeenLastCalledWith(
      "/schedule?mode=month&anchor=2026-01-01",
    );
    await userEvent.click(screen.getByRole("button", { name: "次へ" }));
    expect(navigation.push).toHaveBeenLastCalledWith(
      "/schedule?mode=week&anchor=2026-01-08",
    );
  });

  it.each([
    ["loading", () => new Promise(() => undefined), "読み込み中"],
    ["error", () => Promise.reject(new Error("failed")), "取得できません"],
    ["empty", () => Promise.resolve([]), "表示できるデータはありません"],
  ])("shows the %s state", async (_name, implementation, text) => {
    api.ganttProjects.mockImplementationOnce(implementation);
    renderPage();
    expect(await screen.findByText(new RegExp(text))).toBeInTheDocument();
  });
});
