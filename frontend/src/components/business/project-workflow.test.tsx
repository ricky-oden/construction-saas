import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";

import { businessKeys } from "@/business/query-keys";
import type { Project } from "@/business/types";
import { ProjectWorkflow } from "@/components/business/project-workflow";
import { ApiClientError } from "@/lib/api/errors";

const state = vi.hoisted(() => ({ role: "MANAGER", write: vi.fn() }));
vi.mock("@/auth/auth-provider", () => ({
  useAuth: () => ({ user: { role: state.role } }),
}));
vi.mock("@/business/api", () => ({
  businessApi: {
    assignees: () =>
      Promise.resolve({
        items: [{ id: 1, display_name: "担当者", is_active: true }],
      }),
    history: () => Promise.resolve({ items: [] }),
  },
  writeBusiness: (...args: unknown[]) => state.write(...args),
}));

const project: Project = {
  id: 1,
  code: "PRJ-1",
  name: "Project",
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
  assignees: [],
};

function renderWorkflow(value = project) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const invalidate = vi.spyOn(client, "invalidateQueries");
  render(
    <QueryClientProvider client={client}>
      <ProjectWorkflow project={value} />
    </QueryClientProvider>,
  );
  return { client, invalidate };
}

beforeEach(() => {
  state.role = "MANAGER";
  state.write.mockReset();
});

it("shows conflict details and refetches project and history caches", async () => {
  state.write.mockRejectedValueOnce(
    new ApiClientError(409, {
      error: {
        code: "VERSION_CONFLICT",
        message: "Conflict",
        field_errors: [],
        conflict: {
          resource_type: "Project",
          resource_id: 1,
          expected_version: 3,
          current_version: 4,
        },
      },
    }),
  );
  const { invalidate } = renderWorkflow();
  await userEvent.click(screen.getByRole("button", { name: "PLANNEDへ変更" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "送信version 3、現在version 4",
  );
  await waitFor(() => {
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: businessKeys.projects.all,
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: businessKeys.history.detail(project.id),
    });
  });
});

it("uses expected version and disables controls while a transition is pending", async () => {
  let resolveRequest: ((value: Project) => void) | undefined;
  state.write.mockImplementationOnce(
    () =>
      new Promise<Project>((resolve) => {
        resolveRequest = resolve;
      }),
  );
  renderWorkflow();
  await userEvent.click(screen.getByRole("button", { name: "PLANNEDへ変更" }));
  expect(
    screen.getAllByRole("button", { name: "処理中です…" })[0],
  ).toBeDisabled();
  expect(state.write).toHaveBeenCalledWith(
    "/projects/1/status-transitions",
    "POST",
    { expected_version: 3, status: "PLANNED" },
  );
  resolveRequest?.({ ...project, status: "PLANNED", version: 4 });
});

it("hides management operations and limits MEMBER transitions", () => {
  state.role = "MEMBER";
  renderWorkflow({ ...project, status: "PLANNED" });
  expect(
    screen.getByRole("button", { name: "IN_PROGRESSへ変更" }),
  ).toBeInTheDocument();
  expect(screen.queryByText("担当者を保存")).not.toBeInTheDocument();
  expect(screen.queryByText("案件をアーカイブ")).not.toBeInTheDocument();
  expect(screen.queryByText("CANCELLEDへ変更")).not.toBeInTheDocument();
});
