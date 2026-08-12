import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { businessKeys } from "@/business/query-keys";
import type {
  ListResponse,
  Project,
  ProjectSearchParams,
} from "@/business/types";
import { KanbanPageContent } from "@/app/kanban/page";
import { AUTH_CLEARED_EVENT } from "@/auth/storage";
import { ApiClientError } from "@/lib/api/errors";

const state = vi.hoisted(() => ({
  role: "MANAGER",
  fetch: vi.fn(),
  write: vi.fn(),
}));

vi.mock("@/auth/auth-provider", () => ({
  useAuth: () => ({ user: { role: state.role } }),
}));
vi.mock("@/auth/protected-route", () => ({
  ProtectedRoute: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("@/business/api", () => ({
  businessApi: { kanbanProjects: (...args: unknown[]) => state.fetch(...args) },
  writeBusiness: (...args: unknown[]) => state.write(...args),
}));

const project: Project = {
  id: 1,
  code: "PRJ-1",
  name: "Kanban Project",
  description: null,
  customer_id: 1,
  property_id: 1,
  start_date: "2026-01-01",
  end_date: "2026-01-31",
  status: "DRAFT",
  version: 3,
  is_archived: false,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  assignees: [{ id: 1, display_name: "担当者", is_active: true }],
};

const search: ProjectSearchParams = {
  name: "",
  status: "",
  customer_id: null,
  property_id: null,
  assignee_id: null,
  period_from: "",
  period_to: "",
  sort: "updated_at",
  order: "desc",
  page: 1,
  page_size: 20,
};

function renderPage(initial: Project[] | null = [project]) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  if (initial !== null)
    client.setQueryData(businessKeys.kanban.board(), initial);
  render(
    <QueryClientProvider client={client}>
      <KanbanPageContent />
    </QueryClientProvider>,
  );
  return client;
}

function column(status: string) {
  const heading = screen.getByRole("heading", { name: status });
  const section = heading.closest("section");
  if (!section) throw new Error(`Missing ${status} column`);
  return within(section);
}

function apiError(status: number) {
  return new ApiClientError(status, {
    error: {
      code: status === 409 ? "VERSION_CONFLICT" : "ERROR",
      message: "failed",
      field_errors: [],
      conflict:
        status === 409
          ? {
              resource_type: "Project",
              resource_id: 1,
              expected_version: 3,
              current_version: 4,
            }
          : null,
    },
  });
}

beforeEach(() => {
  state.role = "MANAGER";
  state.fetch.mockReset().mockResolvedValue([project]);
  state.write.mockReset();
});

it("moves before the API resolves, prevents a second operation, then applies server version", async () => {
  let resolveRequest: ((value: Project) => void) | undefined;
  state.write.mockImplementationOnce(
    () =>
      new Promise<Project>((resolve) => {
        resolveRequest = resolve;
      }),
  );
  let server = project;
  state.fetch.mockImplementation(() => Promise.resolve([server]));
  renderPage();

  await userEvent.click(screen.getByRole("button", { name: "PLANNEDへ移動" }));
  expect(column("PLANNED").getByText("Kanban Project")).toBeInTheDocument();
  expect(
    screen.getAllByRole("button", { name: "処理中です…" })[0],
  ).toBeDisabled();
  expect(state.write).toHaveBeenCalledWith(
    "/projects/1/status-transitions",
    "POST",
    { expected_version: 3, status: "PLANNED" },
    { handleUnauthorized: false },
  );

  server = { ...project, status: "PLANNED", version: 4 };
  resolveRequest?.(server);
  await waitFor(() => expect(screen.getByText("4")).toBeInTheDocument());
  expect(column("PLANNED").getByText("Kanban Project")).toBeInTheDocument();
});

describe.each([
  [401, "認証期限"],
  [403, "権限"],
  [422, "許可されていない"],
  [500, "サーバー処理"],
] as const)("failed status %s", (status, message) => {
  it("rolls every project cache back and shows a message", async () => {
    state.write.mockRejectedValueOnce(apiError(status));
    const client = renderPage();
    const listKey = businessKeys.projects.list(search);
    const ganttKey = businessKeys.gantt.range("2026-01-01", "2026-01-31");
    const list: ListResponse<Project> = {
      items: [project],
      page: 1,
      page_size: 20,
      total: 1,
      total_pages: 1,
    };
    client.setQueryData(listKey, list);
    client.setQueryData(businessKeys.projects.detail(1), project);
    client.setQueryData(ganttKey, [project]);

    await userEvent.click(
      screen.getByRole("button", { name: "PLANNEDへ移動" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(column("DRAFT").getByText("Kanban Project")).toBeInTheDocument();
    expect(
      client.getQueryData<ListResponse<Project>>(listKey)?.items[0].status,
    ).toBe("DRAFT");
    expect(
      client.getQueryData<Project>(businessKeys.projects.detail(1))?.status,
    ).toBe("DRAFT");
    expect(client.getQueryData<Project[]>(ganttKey)?.[0].status).toBe("DRAFT");
  });
});

it("restores the snapshot before dispatching the existing 401 auth flow", async () => {
  state.write.mockRejectedValueOnce(apiError(401));
  const client = renderPage();
  let statusWhenAuthCleared: string | undefined;
  window.addEventListener(
    AUTH_CLEARED_EVENT,
    () => {
      statusWhenAuthCleared = client.getQueryData<Project[]>(
        businessKeys.kanban.board(),
      )?.[0].status;
    },
    { once: true },
  );

  await userEvent.click(screen.getByRole("button", { name: "PLANNEDへ移動" }));
  await screen.findByRole("alert");
  expect(statusWhenAuthCleared).toBe("DRAFT");
});

it("rolls back a network failure and retries from server state", async () => {
  state.write.mockRejectedValueOnce(new TypeError("network down"));
  renderPage();
  await userEvent.click(screen.getByRole("button", { name: "PLANNEDへ移動" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("通信に失敗");
  expect(column("DRAFT").getByText("Kanban Project")).toBeInTheDocument();
  expect(state.fetch).toHaveBeenCalledTimes(2);
});

it("rolls back 409 and refetches the server winner", async () => {
  const winner = { ...project, status: "CANCELLED" as const, version: 4 };
  state.write.mockImplementationOnce(async () => {
    state.fetch.mockResolvedValue([winner]);
    throw apiError(409);
  });
  renderPage();
  await userEvent.click(screen.getByRole("button", { name: "PLANNEDへ移動" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("更新が競合");
  await waitFor(() =>
    expect(column("CANCELLED").getByText("Kanban Project")).toBeInTheDocument(),
  );
  expect(screen.getByText("4")).toBeInTheDocument();
});

it("invalidates list, detail, Gantt and history after success and failure", async () => {
  state.write.mockResolvedValueOnce({
    ...project,
    status: "PLANNED",
    version: 4,
  });
  const client = renderPage();
  const invalidate = vi.spyOn(client, "invalidateQueries");
  await userEvent.click(screen.getByRole("button", { name: "PLANNEDへ移動" }));
  await waitFor(() => {
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: businessKeys.projects.all,
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: businessKeys.gantt.all,
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: businessKeys.history.detail(project.id),
    });
  });
});

it("hides management-only transitions from MEMBER and links to detail", () => {
  state.role = "MEMBER";
  renderPage([{ ...project, status: "PLANNED" }]);
  expect(
    screen.getByRole("button", { name: "IN_PROGRESSへ移動" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "CANCELLEDへ移動" }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Kanban Project" })).toHaveAttribute(
    "href",
    "/projects/1",
  );
});

it("shows loading, error and empty states", async () => {
  state.fetch.mockImplementation(() => new Promise(() => undefined));
  renderPage(null);
  expect(screen.getByRole("status")).toBeInTheDocument();
  cleanup();

  state.fetch.mockRejectedValueOnce(new Error("failed"));
  const { unmount } = render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <KanbanPageContent />
    </QueryClientProvider>,
  );
  expect(await screen.findByRole("alert")).toBeInTheDocument();
  unmount();

  state.fetch.mockResolvedValueOnce([]);
  renderPage(null);
  expect(
    await screen.findByText("表示できるデータはありません。"),
  ).toBeInTheDocument();
});
