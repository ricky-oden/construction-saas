import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import { businessKeys } from "@/business/query-keys";
import type {
  ListResponse,
  Project,
  ProjectSearchParams,
} from "@/business/types";
import {
  applyProjectStatusToCaches,
  restoreStatusCaches,
  snapshotStatusCaches,
} from "@/kanban/status-cache";

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

const baseSearch: ProjectSearchParams = {
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

function list(items: Project[]): ListResponse<Project> {
  return { items, page: 1, page_size: 20, total: items.length, total_pages: 1 };
}

describe("status cache updates", () => {
  it("updates only recognized project shapes across Kanban, lists, detail and Gantt", () => {
    const client = new QueryClient();
    const unfiltered = businessKeys.projects.list(baseSearch);
    const draft = businessKeys.projects.list({
      ...baseSearch,
      status: "DRAFT",
    });
    const unrelated = ["projects", "list", "unexpected"] as const;
    client.setQueryData(businessKeys.kanban.board(), [project]);
    client.setQueryData(unfiltered, list([project]));
    client.setQueryData(draft, list([project]));
    client.setQueryData(businessKeys.projects.detail(1), project);
    client.setQueryData(businessKeys.gantt.range("2026-01-01", "2026-01-31"), [
      project,
    ]);
    client.setQueryData(unrelated, { keep: true });

    const moved = { ...project, status: "PLANNED" as const };
    applyProjectStatusToCaches(client, moved);

    expect(
      client.getQueryData<Project[]>(businessKeys.kanban.board())?.[0].status,
    ).toBe("PLANNED");
    expect(
      client.getQueryData<ListResponse<Project>>(unfiltered)?.items[0].status,
    ).toBe("PLANNED");
    expect(client.getQueryData<ListResponse<Project>>(draft)).toMatchObject({
      items: [],
      total: 0,
      total_pages: 0,
    });
    expect(
      client.getQueryData<Project>(businessKeys.projects.detail(1))?.status,
    ).toBe("PLANNED");
    expect(
      client.getQueryData<Project[]>(
        businessKeys.gantt.range("2026-01-01", "2026-01-31"),
      )?.[0].status,
    ).toBe("PLANNED");
    expect(client.getQueryData(unrelated)).toEqual({ keep: true });
  });

  it("restores complete snapshots including history", () => {
    const client = new QueryClient();
    const historyKey = businessKeys.history.detail(project.id);
    client.setQueryData(businessKeys.kanban.board(), [project]);
    client.setQueryData(businessKeys.projects.detail(project.id), project);
    client.setQueryData(historyKey, {
      items: [{ id: 1, action: "STATUS_CHANGED" }],
    });
    const snapshots = snapshotStatusCaches(client, project.id);

    applyProjectStatusToCaches(client, { ...project, status: "PLANNED" });
    client.setQueryData(historyKey, { items: [] });
    restoreStatusCaches(client, snapshots);

    expect(
      client.getQueryData<Project[]>(businessKeys.kanban.board())?.[0].status,
    ).toBe("DRAFT");
    expect(client.getQueryData(historyKey)).toEqual({
      items: [{ id: 1, action: "STATUS_CHANGED" }],
    });
  });
});
