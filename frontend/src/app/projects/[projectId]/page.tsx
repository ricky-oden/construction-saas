"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/auth/auth-provider";
import { ProtectedRoute } from "@/auth/protected-route";
import { businessApi } from "@/business/api";
import { businessKeys } from "@/business/query-keys";
import { ProjectForm } from "@/components/business/project-form";
import { ProjectWorkflow } from "@/components/business/project-workflow";
import { AsyncState } from "@/components/ui/async-state";

export default function ProjectDetailPage() {
  const id = Number(useParams<{ projectId: string }>().projectId);
  const [saved, setSaved] = useState(false);
  const { user } = useAuth();
  const management = user?.role === "ADMIN" || user?.role === "MANAGER";
  const query = useQuery({
    queryKey: businessKeys.projects.detail(id),
    queryFn: () => businessApi.project(id),
  });
  return (
    <ProtectedRoute>
      <main className="page-stack narrow-page">
        {query.isPending ? (
          <AsyncState kind="loading" />
        ) : query.isError ? (
          <AsyncState kind="error" />
        ) : (
          <section className="panel">
            <h1>案件詳細・更新</h1>
            {saved && <p role="status">保存しました。</p>}
            {management && (
              <ProjectForm
                project={query.data}
                onSaved={() => {
                  query.refetch();
                  setSaved(true);
                }}
              />
            )}
            <ProjectWorkflow project={query.data} />
          </section>
        )}
      </main>
    </ProtectedRoute>
  );
}
