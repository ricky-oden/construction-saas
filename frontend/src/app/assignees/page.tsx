"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { ManagementRoute } from "@/auth/management-route";
import { businessApi, writeBusiness } from "@/business/api";
import { formErrorMessage } from "@/business/form-error";
import { businessKeys } from "@/business/query-keys";
import type { Assignee } from "@/business/types";
import { AsyncState } from "@/components/ui/async-state";
import { Button } from "@/components/ui/button";

type CreateFields = { user_id: number; display_name: string };

function AssigneeEditor({ assignee }: Readonly<{ assignee: Assignee }>) {
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState(assignee.display_name);
  const [isActive, setIsActive] = useState(assignee.is_active);
  const [error, setError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: () =>
      writeBusiness<Assignee>(`/assignees/${assignee.id}`, "PATCH", {
        display_name: displayName,
        is_active: isActive,
      }),
    onSuccess: async (saved) => {
      queryClient.setQueryData(businessKeys.assignees.detail(saved.id), saved);
      await queryClient.invalidateQueries({
        queryKey: businessKeys.assignees.all,
      });
    },
  });

  return (
    <article className="record-card page-stack">
      <label>
        表示名
        <input
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
        />
      </label>
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(event) => setIsActive(event.target.checked)}
        />
        有効
      </label>
      {error && <p role="alert">{error}</p>}
      <Button
        loading={mutation.isPending}
        disabled={mutation.isPending || displayName.trim() === ""}
        onClick={async () => {
          setError(null);
          try {
            await mutation.mutateAsync();
          } catch (caught) {
            setError(formErrorMessage(caught));
          }
        }}
      >
        担当者を更新
      </Button>
    </article>
  );
}

export default function AssigneesPage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState } = useForm<CreateFields>({
    defaultValues: { user_id: 0, display_name: "" },
  });
  const query = useQuery({
    queryKey: businessKeys.assignees.list(),
    queryFn: businessApi.assignees,
  });
  const create = useMutation({
    mutationFn: (values: CreateFields) =>
      writeBusiness<Assignee>("/assignees", "POST", values),
    onSuccess: async () => {
      reset();
      await queryClient.invalidateQueries({
        queryKey: businessKeys.assignees.all,
      });
    },
  });
  const submit = handleSubmit(async (values) => {
    setError(null);
    try {
      await create.mutateAsync(values);
    } catch (caught) {
      setError(formErrorMessage(caught));
    }
  });

  return (
    <ManagementRoute>
      <main className="page-stack">
        <div className="page-heading">
          <div>
            <p className="eyebrow">担当者管理</p>
            <h1>担当者一覧・登録</h1>
          </div>
        </div>
        <form className="panel form-stack" onSubmit={submit} noValidate>
          <h2>担当者を登録</h2>
          <p>担当者に関連付ける既存ログインユーザーIDを指定します。</p>
          <label>
            ユーザーID
            <input
              type="number"
              min={1}
              {...register("user_id", {
                valueAsNumber: true,
                min: {
                  value: 1,
                  message: "1以上のユーザーIDを入力してください。",
                },
              })}
            />
          </label>
          {formState.errors.user_id && (
            <p role="alert">{formState.errors.user_id.message}</p>
          )}
          <label>
            表示名
            <input
              maxLength={200}
              {...register("display_name", { required: "表示名は必須です。" })}
            />
          </label>
          {formState.errors.display_name && (
            <p role="alert">{formState.errors.display_name.message}</p>
          )}
          {error && <p role="alert">{error}</p>}
          <Button
            type="submit"
            loading={formState.isSubmitting}
            disabled={formState.isSubmitting}
          >
            担当者を登録
          </Button>
        </form>

        {query.isPending ? (
          <AsyncState kind="loading" />
        ) : query.isError ? (
          <AsyncState kind="error" />
        ) : query.data.items.length === 0 ? (
          <AsyncState kind="empty" />
        ) : (
          <section className="card-list" aria-label="担当者一覧">
            {query.data.items.map((assignee) => (
              <AssigneeEditor assignee={assignee} key={assignee.id} />
            ))}
          </section>
        )}
      </main>
    </ManagementRoute>
  );
}
