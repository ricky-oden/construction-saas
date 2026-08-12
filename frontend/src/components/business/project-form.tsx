"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { businessApi, writeBusiness } from "@/business/api";
import { formErrorMessage } from "@/business/form-error";
import { businessKeys, referenceListParams } from "@/business/query-keys";
import type { Project } from "@/business/types";
import { Button } from "@/components/ui/button";

type ProjectFields = {
  code: string;
  name: string;
  description: string;
  customer_id: number;
  property_id: number;
  start_date: string;
  end_date: string;
  is_archived: boolean;
};

export function ProjectForm({
  project,
  onSaved,
}: Readonly<{ project?: Project; onSaved: (project: Project) => void }>) {
  const customers = useQuery({
    queryKey: businessKeys.customers.list(referenceListParams),
    queryFn: () => businessApi.customers(referenceListParams),
  });
  const properties = useQuery({
    queryKey: businessKeys.properties.list(referenceListParams),
    queryFn: () => businessApi.properties(referenceListParams),
  });
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);
  const { register, handleSubmit, control, formState } = useForm<ProjectFields>(
    {
      defaultValues: {
        code: project?.code ?? "",
        name: project?.name ?? "",
        description: project?.description ?? "",
        customer_id: project?.customer_id,
        property_id: project?.property_id,
        start_date: project?.start_date ?? "",
        end_date: project?.end_date ?? "",
        is_archived: project?.is_archived ?? false,
      },
    },
  );
  const customerId = useWatch({ control, name: "customer_id" });
  const matchingProperties =
    properties.data?.items.filter(
      (item) => item.customer_id === Number(customerId),
    ) ?? [];
  const mutation = useMutation({
    mutationFn: (values: ProjectFields) =>
      writeBusiness<Project>(
        project ? `/projects/${project.id}` : "/projects",
        project ? "PATCH" : "POST",
        project ? values : { ...values, is_archived: undefined },
      ),
    onSuccess: async (saved) => {
      queryClient.setQueryData(businessKeys.projects.detail(saved.id), saved);
      await queryClient.invalidateQueries({
        queryKey: businessKeys.projects.lists(),
      });
      onSaved(saved);
    },
  });
  const submit = handleSubmit(async (values) => {
    setApiError(null);
    if (values.start_date > values.end_date) {
      setApiError("開始日は終了日以前にしてください。");
      return;
    }
    try {
      await mutation.mutateAsync(values);
    } catch (error) {
      setApiError(formErrorMessage(error));
    }
  });

  const hasCurrentCustomer = customers.data?.items.some(
    (item) => item.id === project?.customer_id,
  );
  const hasCurrentProperty = matchingProperties.some(
    (item) => item.id === project?.property_id,
  );
  return (
    <form className="form-stack" onSubmit={submit} noValidate>
      <label>
        案件コード
        <input
          maxLength={30}
          {...register("code", { required: "案件コードは必須です。" })}
        />
      </label>
      <label>
        案件名
        <input
          maxLength={150}
          {...register("name", { required: "案件名は必須です。" })}
        />
      </label>
      <label>
        説明
        <textarea {...register("description")} />
      </label>
      <label>
        顧客
        <select
          {...register("customer_id", {
            required: "顧客は必須です。",
            valueAsNumber: true,
          })}
        >
          <option value="">選択してください</option>
          {project && !hasCurrentCustomer && (
            <option value={project.customer_id}>
              現在の無効顧客 #{project.customer_id}
            </option>
          )}
          {customers.data?.items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.code} {item.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        物件
        <select
          {...register("property_id", {
            required: "物件は必須です。",
            valueAsNumber: true,
          })}
        >
          <option value="">選択してください</option>
          {project && !hasCurrentProperty && (
            <option value={project.property_id}>
              現在の無効物件 #{project.property_id}
            </option>
          )}
          {matchingProperties.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        開始日
        <input
          type="date"
          {...register("start_date", { required: "開始日は必須です。" })}
        />
      </label>
      <label>
        終了日
        <input
          type="date"
          {...register("end_date", { required: "終了日は必須です。" })}
        />
      </label>
      {project && (
        <>
          <p>
            状態: {project.status}／version: {project.version}（Phase
            6まで変更対象外）
          </p>
          <label className="checkbox-row">
            <input type="checkbox" {...register("is_archived")} />
            アーカイブ
          </label>
        </>
      )}
      {Object.values(formState.errors).map((error, index) => (
        <p role="alert" key={index}>
          {error.message}
        </p>
      ))}
      {apiError && <p role="alert">{apiError}</p>}
      <Button
        type="submit"
        loading={formState.isSubmitting}
        disabled={
          formState.isSubmitting || customers.isPending || properties.isPending
        }
      >
        保存
      </Button>
    </form>
  );
}
