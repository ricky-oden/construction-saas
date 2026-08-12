"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { ManagementRoute } from "@/auth/management-route";
import { businessApi } from "@/business/api";
import { AsyncState } from "@/components/ui/async-state";

export default function PropertiesPage() {
  const query = useQuery({
    queryKey: ["properties"],
    queryFn: businessApi.properties,
  });
  return (
    <ManagementRoute>
      <main className="page-stack">
        <div className="page-heading">
          <div>
            <p className="eyebrow">物件管理</p>
            <h1>物件一覧</h1>
          </div>
          <Link className="button-link" href="/properties/new">
            物件を登録
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
            {query.data.items.map((item) => (
              <Link
                className="record-card"
                href={`/properties/${item.id}`}
                key={item.id}
              >
                <strong>{item.name}</strong>
                <span>
                  {item.prefecture}
                  {item.city}
                  {item.address_line}
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </ManagementRoute>
  );
}
