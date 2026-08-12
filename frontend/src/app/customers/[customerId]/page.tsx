"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useState } from "react";

import { ManagementRoute } from "@/auth/management-route";
import { businessApi } from "@/business/api";
import { CustomerForm } from "@/components/business/customer-form";
import { AsyncState } from "@/components/ui/async-state";

export default function CustomerDetailPage() {
  const id = Number(useParams<{ customerId: string }>().customerId);
  const [saved, setSaved] = useState(false);
  const query = useQuery({
    queryKey: ["customers", id],
    queryFn: () => businessApi.customer(id),
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
            <h1>顧客詳細・更新</h1>
            {saved && <p role="status">保存しました。</p>}
            <CustomerForm
              customer={query.data}
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
