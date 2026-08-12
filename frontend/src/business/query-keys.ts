import type { PaginationParams, ProjectSearchParams } from "@/business/types";

export const referenceListParams = { page: 1, page_size: 100 } as const;

export const businessKeys = {
  customers: {
    all: ["customers"] as const,
    lists: () => [...businessKeys.customers.all, "list"] as const,
    list: (params: PaginationParams) =>
      [...businessKeys.customers.lists(), params] as const,
    details: () => [...businessKeys.customers.all, "detail"] as const,
    detail: (id: number) => [...businessKeys.customers.details(), id] as const,
  },
  properties: {
    all: ["properties"] as const,
    lists: () => [...businessKeys.properties.all, "list"] as const,
    list: (params: PaginationParams) =>
      [...businessKeys.properties.lists(), params] as const,
    details: () => [...businessKeys.properties.all, "detail"] as const,
    detail: (id: number) => [...businessKeys.properties.details(), id] as const,
  },
  projects: {
    all: ["projects"] as const,
    lists: () => [...businessKeys.projects.all, "list"] as const,
    list: (params: ProjectSearchParams) =>
      [...businessKeys.projects.lists(), params] as const,
    details: () => [...businessKeys.projects.all, "detail"] as const,
    detail: (id: number) => [...businessKeys.projects.details(), id] as const,
  },
  assignees: {
    all: ["assignees"] as const,
    list: () => [...businessKeys.assignees.all, "list"] as const,
  },
  history: {
    all: ["project-history"] as const,
    detail: (projectId: number) =>
      [...businessKeys.history.all, projectId] as const,
  },
  gantt: {
    all: ["gantt"] as const,
    range: (periodFrom: string, periodTo: string) =>
      [...businessKeys.gantt.all, { periodFrom, periodTo }] as const,
  },
};
