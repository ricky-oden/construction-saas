import type { QueryClient, QueryKey } from "@tanstack/react-query";

import { businessKeys } from "@/business/query-keys";
import type {
  ListResponse,
  Project,
  ProjectSearchParams,
} from "@/business/types";

export type CacheSnapshot = readonly [QueryKey, unknown][];

function isProject(value: unknown): value is Project {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<Project>;
  return (
    typeof candidate.id === "number" &&
    typeof candidate.status === "string" &&
    typeof candidate.version === "number"
  );
}

function isProjectArray(value: unknown): value is Project[] {
  return Array.isArray(value) && value.every(isProject);
}

function isProjectList(value: unknown): value is ListResponse<Project> {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<ListResponse<Project>>;
  return (
    isProjectArray(candidate.items) &&
    typeof candidate.page === "number" &&
    typeof candidate.page_size === "number" &&
    typeof candidate.total === "number" &&
    typeof candidate.total_pages === "number"
  );
}

function replaceInArray(items: Project[], project: Project): Project[] {
  return items.map((item) => (item.id === project.id ? project : item));
}

function updateList(
  value: ListResponse<Project>,
  params: ProjectSearchParams | undefined,
  project: Project,
): ListResponse<Project> {
  const index = value.items.findIndex((item) => item.id === project.id);
  if (index < 0) return value;
  const belongsToStatus = !params?.status || params.status === project.status;
  if (belongsToStatus) {
    return { ...value, items: replaceInArray(value.items, project) };
  }
  const items = value.items.filter((item) => item.id !== project.id);
  const total = Math.max(0, value.total - 1);
  return {
    ...value,
    items,
    total,
    total_pages: total === 0 ? 0 : Math.ceil(total / value.page_size),
  };
}

export function snapshotStatusCaches(
  queryClient: QueryClient,
  projectId: number,
): CacheSnapshot {
  const families = [
    businessKeys.kanban.all,
    businessKeys.projects.lists(),
    businessKeys.projects.detail(projectId),
    businessKeys.gantt.all,
    businessKeys.history.detail(projectId),
  ];
  return families.flatMap((queryKey) =>
    queryClient.getQueriesData({ queryKey }),
  );
}

export function applyProjectStatusToCaches(
  queryClient: QueryClient,
  project: Project,
) {
  queryClient
    .getQueriesData({ queryKey: businessKeys.kanban.all })
    .forEach(([key, value]) => {
      if (isProjectArray(value)) {
        queryClient.setQueryData(key, replaceInArray(value, project));
      }
    });

  queryClient
    .getQueriesData({ queryKey: businessKeys.projects.lists() })
    .forEach(([key, value]) => {
      if (!isProjectList(value)) return;
      const params = key[2] as ProjectSearchParams | undefined;
      queryClient.setQueryData(key, updateList(value, params, project));
    });

  const detailKey = businessKeys.projects.detail(project.id);
  const detail = queryClient.getQueryData(detailKey);
  if (isProject(detail)) queryClient.setQueryData(detailKey, project);

  queryClient
    .getQueriesData({ queryKey: businessKeys.gantt.all })
    .forEach(([key, value]) => {
      if (isProjectArray(value)) {
        queryClient.setQueryData(key, replaceInArray(value, project));
      }
    });
}

export function restoreStatusCaches(
  queryClient: QueryClient,
  snapshots: CacheSnapshot,
) {
  snapshots.forEach(([key, value]) => queryClient.setQueryData(key, value));
}

export async function cancelStatusQueries(
  queryClient: QueryClient,
  projectId: number,
) {
  await Promise.all([
    queryClient.cancelQueries({ queryKey: businessKeys.kanban.all }),
    queryClient.cancelQueries({ queryKey: businessKeys.projects.all }),
    queryClient.cancelQueries({ queryKey: businessKeys.gantt.all }),
    queryClient.cancelQueries({
      queryKey: businessKeys.history.detail(projectId),
    }),
  ]);
}

export async function reconcileStatusQueries(
  queryClient: QueryClient,
  projectId: number,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: businessKeys.kanban.all }),
    queryClient.invalidateQueries({ queryKey: businessKeys.projects.all }),
    queryClient.invalidateQueries({ queryKey: businessKeys.gantt.all }),
    queryClient.invalidateQueries({
      queryKey: businessKeys.history.detail(projectId),
    }),
  ]);
}
