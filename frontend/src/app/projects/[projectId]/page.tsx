"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useState } from "react";

import { ManagementRoute } from "@/auth/management-route";
import { businessApi } from "@/business/api";
import { ProjectForm } from "@/components/business/project-form";
import { AsyncState } from "@/components/ui/async-state";

export default function ProjectDetailPage() {
  const id = Number(useParams<{ projectId: string }>().projectId);
  const [saved, setSaved] = useState(false);
  const query = useQuery({
    queryKey: ["projects", id],
    queryFn: () => businessApi.project(id),
  });
  return (
    <ManagementRoute>
      <main className="page-stack narrow-page">
        {query.isPending ? (
          <AsyncState kind="loading" />
        ) : query.isError ? (
          <AsyncState kind="error" />
        ) : (
          <section className="panel">
            <h1>案件詳細・更新</h1>
            {saved && <p role="status">保存しました。</p>}
            <ProjectForm
              project={query.data}
              onSaved={() => {
                query.refetch();
                setSaved(true);
              }}
            />
          </section>
        )}
      </main>
    </ManagementRoute>
  );
}
