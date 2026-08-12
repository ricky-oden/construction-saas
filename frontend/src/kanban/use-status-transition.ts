"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { clearStoredToken } from "@/auth/storage";
import { writeBusiness } from "@/business/api";
import type { Project, ProjectStatus } from "@/business/types";
import { ApiClientError } from "@/lib/api/errors";
import {
  applyProjectStatusToCaches,
  cancelStatusQueries,
  reconcileStatusQueries,
  restoreStatusCaches,
  snapshotStatusCaches,
  type CacheSnapshot,
} from "@/kanban/status-cache";

type TransitionInput = { project: Project; target: ProjectStatus };
type TransitionContext = { snapshots: CacheSnapshot };

function transitionErrorMessage(error: unknown): string {
  if (!(error instanceof ApiClientError)) {
    return "通信に失敗しました。時間をおいて再試行してください。";
  }
  if (error.status === 401)
    return "認証期限が切れました。再ログインしてください。";
  if (error.status === 403) return "この案件を移動する権限がありません。";
  if (error.status === 409) {
    const conflict = error.response.error.conflict;
    return `更新が競合しました（送信version ${conflict?.expected_version ?? "-"}、現在version ${conflict?.current_version ?? "-"}）。最新版を再取得しました。`;
  }
  if (error.status === 422) return "許可されていない状態遷移です。";
  return "サーバー処理に失敗しました。時間をおいて再試行してください。";
}

export function useStatusTransition() {
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const mutation = useMutation<
    Project,
    unknown,
    TransitionInput,
    TransitionContext
  >({
    mutationFn: ({ project, target }) =>
      writeBusiness<Project>(
        `/projects/${project.id}/status-transitions`,
        "POST",
        { expected_version: project.version, status: target },
        { handleUnauthorized: false },
      ),
    onMutate: async ({ project, target }) => {
      setErrorMessage(null);
      await cancelStatusQueries(queryClient, project.id);
      const snapshots = snapshotStatusCaches(queryClient, project.id);
      applyProjectStatusToCaches(queryClient, { ...project, status: target });
      return { snapshots };
    },
    onSuccess: (saved) => applyProjectStatusToCaches(queryClient, saved),
    onError: (error, _input, context) => {
      if (context) restoreStatusCaches(queryClient, context.snapshots);
      setErrorMessage(transitionErrorMessage(error));
      if (error instanceof ApiClientError && error.status === 401) {
        clearStoredToken();
      }
    },
    onSettled: async (_data, _error, input) => {
      await reconcileStatusQueries(queryClient, input.project.id);
    },
  });

  return {
    move: mutation.mutate,
    pendingProjectId: mutation.isPending
      ? mutation.variables?.project.id
      : null,
    errorMessage,
  };
}
