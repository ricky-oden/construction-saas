import type {
  Customer,
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
};

export function writeBusiness<T>(
  path: string,
  method: "POST" | "PATCH",
  body: unknown,
) {
  return apiRequest<T>(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
