import type {
  ProjectSearchParams,
  ProjectSort,
  ProjectStatus,
  SortOrder,
} from "@/business/types";

const statuses = new Set<ProjectStatus>([
  "DRAFT",
  "PLANNED",
  "IN_PROGRESS",
  "ON_HOLD",
  "COMPLETED",
  "CANCELLED",
]);
const sorts = new Set<ProjectSort>([
  "code",
  "name",
  "start_date",
  "end_date",
  "created_at",
  "updated_at",
]);
const orders = new Set<SortOrder>(["asc", "desc"]);

export const defaultProjectSearch: ProjectSearchParams = {
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

type SearchParamsReader = { get(name: string): string | null };

function positiveInteger(
  value: string | null,
  fallback: number,
  maximum?: number,
) {
  const parsed = Number(value);
  if (
    !Number.isInteger(parsed) ||
    parsed < 1 ||
    (maximum !== undefined && parsed > maximum)
  ) {
    return fallback;
  }
  return parsed;
}

export function projectSearchFromUrl(
  searchParams: SearchParamsReader,
): ProjectSearchParams {
  const status = searchParams.get("status") ?? "";
  const sort = searchParams.get("sort") ?? "";
  const order = searchParams.get("order") ?? "";
  const customerId = searchParams.get("customer_id");
  const propertyId = searchParams.get("property_id");
  const assigneeId = searchParams.get("assignee_id");
  return {
    name: searchParams.get("name")?.trim() ?? "",
    status: statuses.has(status as ProjectStatus)
      ? (status as ProjectStatus)
      : "",
    customer_id: customerId ? positiveInteger(customerId, 0) || null : null,
    property_id: propertyId ? positiveInteger(propertyId, 0) || null : null,
    assignee_id: assigneeId ? positiveInteger(assigneeId, 0) || null : null,
    period_from: searchParams.get("period_from") ?? "",
    period_to: searchParams.get("period_to") ?? "",
    sort: sorts.has(sort as ProjectSort) ? (sort as ProjectSort) : "updated_at",
    order: orders.has(order as SortOrder) ? (order as SortOrder) : "desc",
    page: positiveInteger(searchParams.get("page"), 1),
    page_size: positiveInteger(searchParams.get("page_size"), 20, 100),
  };
}

export function projectSearchToUrl(params: ProjectSearchParams) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    const defaultValue = defaultProjectSearch[key as keyof ProjectSearchParams];
    if (value !== "" && value !== null && value !== defaultValue) {
      query.set(key, String(value));
    }
  });
  return query.toString();
}

export function describeProjectSearch(params: ProjectSearchParams) {
  const conditions = [
    params.name && `案件名: ${params.name}`,
    params.status && `状態: ${params.status}`,
    params.customer_id && `顧客ID: ${params.customer_id}`,
    params.property_id && `物件ID: ${params.property_id}`,
    params.assignee_id && `担当者ID: ${params.assignee_id}`,
    params.period_from && `期間開始: ${params.period_from}`,
    params.period_to && `期間終了: ${params.period_to}`,
    `並び順: ${params.sort} ${params.order}`,
    `ページ: ${params.page}`,
  ].filter(Boolean);
  return conditions.join("／");
}
