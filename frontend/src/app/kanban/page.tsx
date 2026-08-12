"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { useAuth } from "@/auth/auth-provider";
import { ProtectedRoute } from "@/auth/protected-route";
import { businessApi } from "@/business/api";
import { businessKeys } from "@/business/query-keys";
import type { Project } from "@/business/types";
import { AsyncState } from "@/components/ui/async-state";
import { Button } from "@/components/ui/button";
import { PROJECT_STATUSES, allowedStatusTargets } from "@/kanban/transitions";
import { useStatusTransition } from "@/kanban/use-status-transition";

type MoveProject = ReturnType<typeof useStatusTransition>["move"];

function ProjectCard({
  project,
  move,
  pendingProjectId,
}: Readonly<{
  project: Project;
  move: MoveProject;
  pendingProjectId: number | null | undefined;
}>) {
  const { user } = useAuth();
  const pending = pendingProjectId === project.id;
  const targets = allowedStatusTargets(project.status, user?.role ?? "MEMBER");

  return (
    <article className="kanban-card" aria-label={`${project.name} 案件カード`}>
      <Link className="kanban-card__title" href={`/projects/${project.id}`}>
        {project.name}
      </Link>
      <dl className="kanban-card__facts">
        <div>
          <dt>status</dt>
          <dd>{project.status}</dd>
        </div>
        <div>
          <dt>期間</dt>
          <dd>
            {project.start_date}〜{project.end_date}
          </dd>
        </div>
        <div>
          <dt>担当者</dt>
          <dd>
            {project.assignees.length === 0
              ? "未割当"
              : project.assignees.map((item) => item.display_name).join("、")}
          </dd>
        </div>
        <div>
          <dt>version</dt>
          <dd>{project.version}</dd>
        </div>
      </dl>
      {targets.length > 0 && (
        <div className="kanban-card__actions" aria-label="移動先">
          {targets.map((target) => (
            <Button
              disabled={pending}
              loading={pending}
              key={target}
              onClick={() => move({ project, target })}
            >
              {target}へ移動
            </Button>
          ))}
        </div>
      )}
    </article>
  );
}

export function KanbanPageContent() {
  const transition = useStatusTransition();
  const projects = useQuery({
    queryKey: businessKeys.kanban.board(),
    queryFn: businessApi.kanbanProjects,
  });

  return (
    <ProtectedRoute>
      <main className="page-stack">
        <div className="page-heading">
          <div>
            <p className="eyebrow">状態管理</p>
            <h1>案件カンバン</h1>
          </div>
          <Link className="text-link" href="/projects">
            案件一覧へ
          </Link>
        </div>

        {projects.isPending ? (
          <AsyncState kind="loading" />
        ) : projects.isError ? (
          <AsyncState kind="error" />
        ) : projects.data.length === 0 ? (
          <AsyncState kind="empty" />
        ) : (
          <>
            {transition.errorMessage && (
              <p role="alert">{transition.errorMessage}</p>
            )}
            <div
              className="kanban-scroll"
              tabIndex={0}
              aria-label="案件カンバンボード"
            >
              <div className="kanban-board">
                {PROJECT_STATUSES.map((status) => {
                  const columnProjects = projects.data.filter(
                    (project) => project.status === status,
                  );
                  return (
                    <section
                      className="kanban-column"
                      key={status}
                      aria-labelledby={`column-${status}`}
                    >
                      <h2 id={`column-${status}`}>{status}</h2>
                      <p>{columnProjects.length}件</p>
                      <div className="kanban-column__cards">
                        {columnProjects.length === 0 ? (
                          <p className="kanban-column__empty">
                            案件はありません。
                          </p>
                        ) : (
                          columnProjects.map((project) => (
                            <ProjectCard
                              project={project}
                              move={transition.move}
                              pendingProjectId={transition.pendingProjectId}
                              key={project.id}
                            />
                          ))
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </main>
    </ProtectedRoute>
  );
}

export default function KanbanPage() {
  return <KanbanPageContent />;
}
