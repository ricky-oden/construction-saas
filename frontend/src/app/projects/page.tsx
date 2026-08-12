"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";

import { ManagementRoute } from "@/auth/management-route";
import { businessApi } from "@/business/api";
import {
  defaultProjectSearch,
  describeProjectSearch,
  projectSearchFromUrl,
  projectSearchToUrl,
} from "@/business/project-search";
import { businessKeys, referenceListParams } from "@/business/query-keys";
import type { ProjectSearchParams } from "@/business/types";
import { Button } from "@/components/ui/button";
import { AsyncState } from "@/components/ui/async-state";

type SearchFields = Omit<ProjectSearchParams, "page">;

export function ProjectsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchText = searchParams.toString();
  const current = useMemo(
    () => projectSearchFromUrl(new URLSearchParams(searchText)),
    [searchText],
  );
  const { register, handleSubmit, reset, getValues, setValue } =
    useForm<SearchFields>({
      defaultValues: current,
    });
  useEffect(() => reset(current), [current, reset]);

  const customers = useQuery({
    queryKey: businessKeys.customers.list(referenceListParams),
    queryFn: () => businessApi.customers(referenceListParams),
  });
  const properties = useQuery({
    queryKey: businessKeys.properties.list(referenceListParams),
    queryFn: () => businessApi.properties(referenceListParams),
  });
  const projects = useQuery({
    queryKey: businessKeys.projects.list(current),
    queryFn: () => businessApi.projects(current),
  });

  const navigate = (next: ProjectSearchParams) => {
    const query = projectSearchToUrl(next);
    router.push(query ? `/projects?${query}` : "/projects");
  };
  const submit = handleSubmit((values) => navigate({ ...values, page: 1 }));
  const updateSelect = (changes: Partial<SearchFields>) => {
    navigate({ ...getValues(), ...changes, page: 1 });
  };
  const changePage = (page: number) => navigate({ ...current, page });
  const resetConditions = () => {
    reset(defaultProjectSearch);
    router.push("/projects");
  };
  const selectedCustomerId = current.customer_id;
  const propertyOptions =
    properties.data?.items.filter(
      (property) =>
        selectedCustomerId === null ||
        property.customer_id === selectedCustomerId,
    ) ?? [];

  return (
    <ManagementRoute>
      <main className="page-stack">
        <div className="page-heading">
          <div>
            <p className="eyebrow">案件管理</p>
            <h1>案件一覧</h1>
          </div>
          <Link className="button-link" href="/projects/new">
            案件を登録
          </Link>
        </div>

        <form className="panel search-grid" onSubmit={submit} noValidate>
          <label>
            案件名
            <input {...register("name")} />
          </label>
          <label>
            状態
            <select
              {...register("status", {
                onChange: (event) =>
                  updateSelect({ status: event.target.value }),
              })}
            >
              <option value="">すべて</option>
              {[
                "DRAFT",
                "PLANNED",
                "IN_PROGRESS",
                "ON_HOLD",
                "COMPLETED",
                "CANCELLED",
              ].map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label>
            顧客
            <select
              {...register("customer_id", {
                onChange: (event) => {
                  const customerId = event.target.value
                    ? Number(event.target.value)
                    : null;
                  setValue("property_id", null);
                  updateSelect({ customer_id: customerId, property_id: null });
                },
              })}
            >
              <option value="">すべて</option>
              {customers.data?.items.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.code} {customer.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            物件
            <select
              {...register("property_id", {
                onChange: (event) =>
                  updateSelect({
                    property_id: event.target.value
                      ? Number(event.target.value)
                      : null,
                  }),
              })}
            >
              <option value="">すべて</option>
              {propertyOptions.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            期間開始
            <input type="date" {...register("period_from")} />
          </label>
          <label>
            期間終了
            <input type="date" {...register("period_to")} />
          </label>
          <label>
            並び替え
            <select
              {...register("sort", {
                onChange: (event) => updateSelect({ sort: event.target.value }),
              })}
            >
              <option value="updated_at">更新日時</option>
              <option value="created_at">登録日時</option>
              <option value="code">案件コード</option>
              <option value="name">案件名</option>
              <option value="start_date">開始日</option>
              <option value="end_date">終了日</option>
            </select>
          </label>
          <label>
            順序
            <select
              {...register("order", {
                onChange: (event) =>
                  updateSelect({ order: event.target.value }),
              })}
            >
              <option value="desc">降順</option>
              <option value="asc">昇順</option>
            </select>
          </label>
          <label>
            1ページ件数
            <select
              {...register("page_size", {
                valueAsNumber: true,
                onChange: (event) =>
                  updateSelect({ page_size: Number(event.target.value) }),
              })}
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <div className="search-actions">
            <Button type="submit">検索</Button>
            <Button type="button" onClick={resetConditions}>
              条件をリセット
            </Button>
          </div>
        </form>

        <p aria-live="polite">現在条件: {describeProjectSearch(current)}</p>
        {projects.isPending ? (
          <AsyncState kind="loading" />
        ) : projects.isError ? (
          <AsyncState kind="error" />
        ) : projects.data.items.length === 0 ? (
          <AsyncState kind="empty" />
        ) : (
          <>
            <p>
              {projects.data.total}件中 {projects.data.items.length}件を表示
            </p>
            <div className="card-list">
              {projects.data.items.map((project) => (
                <Link
                  className="record-card"
                  href={`/projects/${project.id}`}
                  key={project.id}
                >
                  <strong>
                    {project.code} {project.name}
                  </strong>
                  <span>
                    {project.status} · {project.start_date}〜{project.end_date}
                  </span>
                </Link>
              ))}
            </div>
            <nav className="pagination" aria-label="案件一覧ページ">
              <Button
                type="button"
                disabled={current.page <= 1}
                onClick={() => changePage(current.page - 1)}
              >
                前のページ
              </Button>
              <span>
                {projects.data.page} / {Math.max(projects.data.total_pages, 1)}
              </span>
              <Button
                type="button"
                disabled={current.page >= projects.data.total_pages}
                onClick={() => changePage(current.page + 1)}
              >
                次のページ
              </Button>
            </nav>
          </>
        )}
      </main>
    </ManagementRoute>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<AsyncState kind="loading" />}>
      <ProjectsPageContent />
    </Suspense>
  );
}
