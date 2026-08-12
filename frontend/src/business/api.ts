import type {
  Customer,
  Assignee,
  AuditLog,
  ListResponse,
  PaginationParams,
  Project,
  ProjectSearchParams,
  Property,
} from "@/business/types";
import { apiRequest } from "@/lib/api/client";

function listPath(path: string, params: object) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      query.set(key, String(value));
    }
  });
  return `${path}?${query.toString()}`;
}

export const businessApi = {
  customers: (params: PaginationParams = { page: 1, page_size: 20 }) =>
    apiRequest<ListResponse<Customer>>(listPath("/customers", params)),
  customer: (id: number) => apiRequest<Customer>(`/customers/${id}`),
  properties: (params: PaginationParams = { page: 1, page_size: 20 }) =>
    apiRequest<ListResponse<Property>>(listPath("/properties", params)),
  property: (id: number) => apiRequest<Property>(`/properties/${id}`),
  projects: (params: ProjectSearchParams) =>
    apiRequest<ListResponse<Project>>(listPath("/projects", params)),
  project: (id: number) => apiRequest<Project>(`/projects/${id}`),
  assignees: () => apiRequest<{ items: Assignee[] }>("/assignees"),
  history: (id: number) =>
    apiRequest<{ items: AuditLog[] }>(`/projects/${id}/history`),
};

export function writeBusiness<T>(
  path: string,
  method: "POST" | "PATCH" | "PUT",
  body: unknown,
) {
  return apiRequest<T>(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
