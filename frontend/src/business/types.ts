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
};

export type ListResponse<T> = { items: T[] };
