"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { ManagementRoute } from "@/auth/management-route";
import { businessApi } from "@/business/api";
import { AsyncState } from "@/components/ui/async-state";

export default function CustomersPage() {
  const query = useQuery({
    queryKey: ["customers"],
    queryFn: businessApi.customers,
  });
  return (
    <ManagementRoute>
      <main className="page-stack">
        <div className="page-heading">
          <div>
            <p className="eyebrow">顧客管理</p>
            <h1>顧客一覧</h1>
          </div>
          <Link className="button-link" href="/customers/new">
            顧客を登録
          </Link>
        </div>
        {query.isPending ? (
          <AsyncState kind="loading" />
        ) : query.isError ? (
          <AsyncState kind="error" />
        ) : query.data.items.length === 0 ? (
          <AsyncState kind="empty" />
        ) : (
          <div className="card-list">
            {query.data.items.map((customer) => (
              <Link
                className="record-card"
                href={`/customers/${customer.id}`}
                key={customer.id}
              >
                <strong>{customer.code}</strong>
                <span>{customer.name}</span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </ManagementRoute>
  );
}
