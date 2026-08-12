"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useState } from "react";

import { ManagementRoute } from "@/auth/management-route";
import { businessApi } from "@/business/api";
import { PropertyForm } from "@/components/business/property-form";
import { AsyncState } from "@/components/ui/async-state";

export default function PropertyDetailPage() {
  const id = Number(useParams<{ propertyId: string }>().propertyId);
  const [saved, setSaved] = useState(false);
  const query = useQuery({
    queryKey: ["properties", id],
    queryFn: () => businessApi.property(id),
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
            <h1>物件詳細・更新</h1>
            {saved && <p role="status">保存しました。</p>}
            <PropertyForm
              property={query.data}
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
