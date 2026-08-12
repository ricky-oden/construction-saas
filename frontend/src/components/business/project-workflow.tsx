"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { useAuth } from "@/auth/auth-provider";
import { businessApi, writeBusiness } from "@/business/api";
import { businessKeys } from "@/business/query-keys";
import type { Project, ProjectStatus } from "@/business/types";
import { Button } from "@/components/ui/button";
import { ApiClientError } from "@/lib/api/errors";

const transitions: Record<ProjectStatus, ProjectStatus[]> = {
  DRAFT: ["PLANNED", "CANCELLED"],
  PLANNED: ["IN_PROGRESS", "ON_HOLD", "CANCELLED"],
  IN_PROGRESS: ["ON_HOLD", "COMPLETED", "CANCELLED"],
  ON_HOLD: ["IN_PROGRESS", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};
const memberTransitions = new Set([
  "PLANNED:IN_PROGRESS",
  "IN_PROGRESS:ON_HOLD",
  "ON_HOLD:IN_PROGRESS",
  "IN_PROGRESS:COMPLETED",
]);

function workflowError(error: unknown) {
  if (error instanceof ApiClientError && error.status === 409) {
    const conflict = error.response.error.conflict;
    return `競合: 送信version ${conflict?.expected_version}、現在version ${conflict?.current_version}`;
  }
  return error instanceof Error ? error.message : "操作に失敗しました。";
}

export function ProjectWorkflow({ project }: Readonly<{ project: Project }>) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const management = user?.role === "ADMIN" || user?.role === "MANAGER";
  const [selectedAssignees, setSelectedAssignees] = useState(
    project.assignees.map((item) => item.id),
  );
  const [error, setError] = useState<string | null>(null);
  const assignees = useQuery({
    queryKey: businessKeys.assignees.list(),
    queryFn: businessApi.assignees,
    enabled: management,
  });
  const history = useQuery({
    queryKey: businessKeys.history.detail(project.id),
    queryFn: () => businessApi.history(project.id),
  });

  const reconcile = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: businessKeys.projects.all }),
      queryClient.invalidateQueries({
        queryKey: businessKeys.history.detail(project.id),
      }),
    ]);
  };
  const mutation = useMutation({
    mutationFn: async ({ path, method, body }: MutationInput) =>
      writeBusiness<Project>(path, method, body),
    onSuccess: (saved) => {
      queryClient.setQueryData(businessKeys.projects.detail(saved.id), saved);
    },
    onSettled: reconcile,
  });
  const execute = async (input: MutationInput) => {
    setError(null);
    try {
      await mutation.mutateAsync(input);
    } catch (caught) {
      setError(workflowError(caught));
    }
  };
  const allowedTargets = transitions[project.status].filter(
    (target) =>
      management || memberTransitions.has(`${project.status}:${target}`),
  );

  return (
    <section className="panel page-stack">
      <h2>案件ワークフロー</h2>
      <p>
        現在状態: {project.status}／version: {project.version}
      </p>
      {error && <p role="alert">{error}</p>}
      <div className="search-actions">
        {allowedTargets.map((status) => (
          <Button
            key={status}
            loading={mutation.isPending}
            disabled={mutation.isPending}
            onClick={() =>
              execute({
                path: `/projects/${project.id}/status-transitions`,
                method: "POST",
                body: { expected_version: project.version, status },
              })
            }
          >
            {status}へ変更
          </Button>
        ))}
      </div>

      {management && (
        <div className="page-stack">
          <h3>担当者</h3>
          {assignees.data?.items.map((assignee) => (
            <label className="checkbox-row" key={assignee.id}>
              <input
                type="checkbox"
                checked={selectedAssignees.includes(assignee.id)}
                onChange={(event) =>
                  setSelectedAssignees((current) =>
                    event.target.checked
                      ? [...current, assignee.id]
                      : current.filter((id) => id !== assignee.id),
                  )
                }
              />
              {assignee.display_name}
            </label>
          ))}
          <Button
            loading={mutation.isPending}
            disabled={mutation.isPending}
            onClick={() =>
              execute({
                path: `/projects/${project.id}/assignees`,
                method: "PUT",
                body: {
                  expected_version: project.version,
                  assignee_ids: selectedAssignees,
                },
              })
            }
          >
            担当者を保存
          </Button>
          {!project.is_archived && (
            <Button
              loading={mutation.isPending}
              disabled={mutation.isPending}
              onClick={() =>
                execute({
                  path: `/projects/${project.id}/archive`,
                  method: "POST",
                  body: { expected_version: project.version },
                })
              }
            >
              案件をアーカイブ
            </Button>
          )}
        </div>
      )}

      <div>
        <h3>変更履歴</h3>
        {history.isPending ? (
          <p role="status">履歴を読み込み中です。</p>
        ) : history.isError ? (
          <p role="alert">履歴を取得できませんでした。</p>
        ) : history.data.items.length === 0 ? (
          <p>変更履歴はありません。</p>
        ) : (
          <ol>
            {history.data.items.map((item) => (
              <li key={item.id}>
                {item.occurred_at} {item.action} version {item.project_version}
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

type MutationInput = {
  path: string;
  method: "POST" | "PUT";
  body: unknown;
};
