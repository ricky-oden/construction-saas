"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";

import { ProtectedRoute } from "@/auth/protected-route";
import { businessApi } from "@/business/api";
import { businessKeys } from "@/business/query-keys";
import { Button } from "@/components/ui/button";
import { AsyncState } from "@/components/ui/async-state";
import {
  barGeometry,
  dateColumns,
  moveAnchor,
  todayInTokyo,
  visibleRange,
  type GanttMode,
} from "@/gantt/date-geometry";
import { ganttStateFromUrl, ganttStateToUrl } from "@/gantt/url-state";

const COLUMN_WIDTH = { month: 40, week: 96 } as const;

export function SchedulePageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const queryText = params.toString();
  const state = useMemo(
    () => ganttStateFromUrl(new URLSearchParams(queryText)),
    [queryText],
  );
  const range = useMemo(
    () => visibleRange(state.mode, state.anchor),
    [state.anchor, state.mode],
  );
  const columns = useMemo(() => dateColumns(range), [range]);
  const projects = useQuery({
    queryKey: businessKeys.gantt.range(range.start, range.end),
    queryFn: () => businessApi.ganttProjects(range.start, range.end),
  });
  const columnWidth = COLUMN_WIDTH[state.mode];
  const timelineWidth = columns.length * columnWidth;

  const navigate = (mode: GanttMode, anchor: string) => {
    router.push(`/schedule?${ganttStateToUrl({ mode, anchor })}`);
  };

  return (
    <ProtectedRoute>
      <main className="page-stack">
        <div className="page-heading">
          <div>
            <p className="eyebrow">工程表示</p>
            <h1>案件ガント</h1>
          </div>
          <Link className="text-link" href="/projects">
            案件一覧へ
          </Link>
        </div>

        <section className="panel gantt-controls" aria-label="ガント表示操作">
          <div className="gantt-mode" aria-label="表示単位">
            <Button
              aria-pressed={state.mode === "month"}
              onClick={() => navigate("month", state.anchor)}
            >
              月表示
            </Button>
            <Button
              aria-pressed={state.mode === "week"}
              onClick={() => navigate("week", state.anchor)}
            >
              週表示
            </Button>
          </div>
          <div className="gantt-navigation">
            <Button
              onClick={() =>
                navigate(state.mode, moveAnchor(state.mode, state.anchor, -1))
              }
            >
              前へ
            </Button>
            <Button onClick={() => navigate(state.mode, todayInTokyo())}>
              今日へ
            </Button>
            <Button
              onClick={() =>
                navigate(state.mode, moveAnchor(state.mode, state.anchor, 1))
              }
            >
              次へ
            </Button>
          </div>
          <p aria-live="polite">
            {state.mode === "month" ? "月表示" : "週表示"}: {range.start}〜
            {range.end}
          </p>
        </section>

        {projects.isPending ? (
          <AsyncState kind="loading" />
        ) : projects.isError ? (
          <AsyncState kind="error" />
        ) : projects.data.length === 0 ? (
          <AsyncState kind="empty" />
        ) : (
          <div className="gantt-scroll" tabIndex={0} aria-label="案件ガント表">
            <div className="gantt-table" style={{ width: 240 + timelineWidth }}>
              <div className="gantt-label gantt-header-label">案件</div>
              <div
                className="gantt-timeline gantt-header"
                style={{ width: timelineWidth }}
              >
                {columns.map((date) => (
                  <div
                    className="gantt-date"
                    style={{ width: columnWidth }}
                    key={date}
                  >
                    <span>{date.slice(5)}</span>
                  </div>
                ))}
              </div>
              {projects.data.map((project) => {
                const geometry = barGeometry(
                  { start: project.start_date, end: project.end_date },
                  range,
                  columnWidth,
                );
                if (geometry === null) return null;
                return (
                  <div className="gantt-row" key={project.id}>
                    <div className="gantt-label">
                      <Link href={`/projects/${project.id}`}>
                        {project.name}
                      </Link>
                      <span className="gantt-status">{project.status}</span>
                    </div>
                    <div
                      className="gantt-timeline gantt-row-grid"
                      style={{ width: timelineWidth }}
                    >
                      {columns.map((date) => (
                        <span
                          aria-hidden="true"
                          className="gantt-cell"
                          style={{ width: columnWidth }}
                          key={date}
                        />
                      ))}
                      <Link
                        aria-label={`${project.name} ${project.start_date}から${project.end_date}`}
                        className="gantt-bar"
                        href={`/projects/${project.id}`}
                        style={{ left: geometry.left, width: geometry.width }}
                        title={`${project.start_date}〜${project.end_date}`}
                      >
                        {project.name}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}

export default function SchedulePage() {
  return (
    <Suspense fallback={<AsyncState kind="loading" />}>
      <SchedulePageContent />
    </Suspense>
  );
}
