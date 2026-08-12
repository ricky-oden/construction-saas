"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { businessApi, writeBusiness } from "@/business/api";
import { formErrorMessage } from "@/business/form-error";
import { businessKeys, referenceListParams } from "@/business/query-keys";
import type { Property } from "@/business/types";
import { Button } from "@/components/ui/button";

type PropertyFields = {
  customer_id: number;
  name: string;
  postal_code: string;
  prefecture: string;
  city: string;
  address_line: string;
  is_active: boolean;
};

export function PropertyForm({
  property,
  onSaved,
}: Readonly<{ property?: Property; onSaved: (property: Property) => void }>) {
  const customers = useQuery({
    queryKey: businessKeys.customers.list(referenceListParams),
    queryFn: () => businessApi.customers(referenceListParams),
  });
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<PropertyFields>({
    defaultValues: {
      customer_id: property?.customer_id,
      name: property?.name ?? "",
      postal_code: property?.postal_code ?? "",
      prefecture: property?.prefecture ?? "",
      city: property?.city ?? "",
      address_line: property?.address_line ?? "",
      is_active: property?.is_active ?? true,
    },
  });
  const mutation = useMutation({
    mutationFn: (values: PropertyFields) => {
      const body = property
        ? { ...values, customer_id: undefined }
        : {
            customer_id: values.customer_id,
            name: values.name,
            postal_code: values.postal_code,
            prefecture: values.prefecture,
            city: values.city,
            address_line: values.address_line,
          };
      return writeBusiness<Property>(
        property ? `/properties/${property.id}` : "/properties",
        property ? "PATCH" : "POST",
        body,
      );
    },
    onSuccess: async (saved) => {
      queryClient.setQueryData(businessKeys.properties.detail(saved.id), saved);
      await queryClient.invalidateQueries({
        queryKey: businessKeys.properties.lists(),
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
      {property ? (
        <p>顧客ID: {property.customer_id}（所属変更は対象外）</p>
      ) : (
        <label>
          顧客
          <select
            {...register("customer_id", {
              required: "顧客は必須です。",
              valueAsNumber: true,
            })}
          >
            <option value="">選択してください</option>
            {customers.data?.items.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.code} {customer.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <label>
        物件名
        <input
          maxLength={100}
          {...register("name", { required: "物件名は必須です。" })}
        />
      </label>
      <label>
        郵便番号
        <input maxLength={10} {...register("postal_code")} />
      </label>
      <label>
        都道府県
        <input
          maxLength={20}
          {...register("prefecture", { required: "都道府県は必須です。" })}
        />
      </label>
      <label>
        市区町村
        <input
          maxLength={100}
          {...register("city", { required: "市区町村は必須です。" })}
        />
      </label>
      <label>
        住所
        <input
          maxLength={200}
          {...register("address_line", { required: "住所は必須です。" })}
        />
      </label>
      {property && (
        <label className="checkbox-row">
          <input type="checkbox" {...register("is_active")} />
          有効
        </label>
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
        disabled={formState.isSubmitting || (!property && customers.isPending)}
      >
        保存
      </Button>
    </form>
  );
}
