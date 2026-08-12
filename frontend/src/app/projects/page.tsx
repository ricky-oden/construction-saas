"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { ManagementRoute } from "@/auth/management-route";
import { businessApi } from "@/business/api";
import { AsyncState } from "@/components/ui/async-state";

export default function ProjectsPage() {
  const query = useQuery({
    queryKey: ["projects"],
    queryFn: businessApi.projects,
  });
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
        {query.isPending ? (
          <AsyncState kind="loading" />
        ) : query.isError ? (
          <AsyncState kind="error" />
        ) : query.data.items.length === 0 ? (
          <AsyncState kind="empty" />
        ) : (
          <div className="card-list">
            {query.data.items.map((project) => (
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
        )}
      </main>
    </ManagementRoute>
  );
}
