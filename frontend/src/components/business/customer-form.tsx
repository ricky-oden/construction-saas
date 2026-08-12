"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";

import type { Customer } from "@/business/types";
import { formErrorMessage } from "@/business/form-error";
import { writeBusiness } from "@/business/api";
import { businessKeys } from "@/business/query-keys";
import { Button } from "@/components/ui/button";

type CustomerFields = {
  code: string;
  name: string;
  contact_name: string;
  phone: string;
  email: string;
  is_active: boolean;
};

export function CustomerForm({
  customer,
  onSaved,
}: Readonly<{ customer?: Customer; onSaved: (customer: Customer) => void }>) {
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<CustomerFields>({
    defaultValues: {
      code: customer?.code ?? "",
      name: customer?.name ?? "",
      contact_name: customer?.contact_name ?? "",
      phone: customer?.phone ?? "",
      email: customer?.email ?? "",
      is_active: customer?.is_active ?? true,
    },
  });
  const mutation = useMutation({
    mutationFn: (values: CustomerFields) =>
      writeBusiness<Customer>(
        customer ? `/customers/${customer.id}` : "/customers",
        customer ? "PATCH" : "POST",
        values,
      ),
    onSuccess: async (saved) => {
      queryClient.setQueryData(businessKeys.customers.detail(saved.id), saved);
      await queryClient.invalidateQueries({
        queryKey: businessKeys.customers.lists(),
      });
      onSaved(saved);
    },
  });

  const submit = handleSubmit(async (values) => {
    setApiError(null);
    try {
      await mutation.mutateAsync(values);
    } catch (error) {
      setApiError(formErrorMessage(error));
    }
  });

  return (
    <form className="form-stack" onSubmit={submit} noValidate>
      <label>
        顧客コード
        <input
          maxLength={30}
          {...register("code", { required: "顧客コードは必須です。" })}
        />
      </label>
      {formState.errors.code && (
        <p role="alert">{formState.errors.code.message}</p>
      )}
      <label>
        顧客名
        <input
          maxLength={100}
          {...register("name", { required: "顧客名は必須です。" })}
        />
      </label>
      {formState.errors.name && (
        <p role="alert">{formState.errors.name.message}</p>
      )}
      <label>
        担当者名
        <input maxLength={100} {...register("contact_name")} />
      </label>
      <label>
        電話番号
        <input maxLength={30} {...register("phone")} />
      </label>
      <label>
        メール
        <input
          type="email"
          maxLength={320}
          {...register("email", {
            pattern: {
              value: /^[^@\s]+@[^@\s]+$/,
              message: "メール形式で入力してください。",
            },
          })}
        />
      </label>
      {formState.errors.email && (
        <p role="alert">{formState.errors.email.message}</p>
      )}
      {customer && (
        <label className="checkbox-row">
          <input type="checkbox" {...register("is_active")} />
          有効
        </label>
      )}
      {apiError && <p role="alert">{apiError}</p>}
      <Button
        type="submit"
        loading={formState.isSubmitting}
        disabled={formState.isSubmitting}
      >
        保存
      </Button>
    </form>
  );
}
