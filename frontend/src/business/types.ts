export type Customer = {
  id: number;
  code: string;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Property = {
  id: number;
  customer_id: number;
  name: string;
  postal_code: string | null;
  prefecture: string;
  city: string;
  address_line: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ProjectStatus =
  "DRAFT" | "PLANNED" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED";

export type SortOrder = "asc" | "desc";
export type ProjectSort =
  "code" | "name" | "start_date" | "end_date" | "created_at" | "updated_at";

export type PaginationParams = {
  page: number;
  page_size: number;
};

export type ProjectSearchParams = PaginationParams & {
  name: string;
  status: ProjectStatus | "";
  customer_id: number | null;
  property_id: number | null;
  assignee_id: number | null;
  period_from: string;
  period_to: string;
  sort: ProjectSort;
  order: SortOrder;
};

export type Project = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  customer_id: number;
  property_id: number;
  start_date: string;
  end_date: string;
  status: ProjectStatus;
  version: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  assignees: Assignee[];
};

export type Assignee = {
  id: number;
  display_name: string;
  is_active: boolean;
};

export type AuditLog = {
  id: number;
  project_id: number;
  actor_user_id: number;
  action: string;
  before_values: Record<string, unknown>;
  after_values: Record<string, unknown>;
  project_version: number;
  occurred_at: string;
};

export type ListResponse<T> = {
  items: T[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
};
