import type {
  Customer,
  ListResponse,
  Project,
  Property,
} from "@/business/types";
import { apiRequest } from "@/lib/api/client";

export const businessApi = {
  customers: () => apiRequest<ListResponse<Customer>>("/customers"),
  customer: (id: number) => apiRequest<Customer>(`/customers/${id}`),
  properties: () => apiRequest<ListResponse<Property>>("/properties"),
  property: (id: number) => apiRequest<Property>(`/properties/${id}`),
  projects: () => apiRequest<ListResponse<Project>>("/projects"),
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
