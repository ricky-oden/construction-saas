"use client";

import type { ReactNode } from "react";

import { useAuth } from "@/auth/auth-provider";
import { ProtectedRoute } from "@/auth/protected-route";

export function ManagementRoute({
  children,
}: Readonly<{ children: ReactNode }>) {
  const { user } = useAuth();
  const allowed = user?.role === "ADMIN" || user?.role === "MANAGER";

  return (
    <ProtectedRoute>
      {allowed ? (
        children
      ) : (
        <section className="panel" role="alert">
          <h1>403</h1>
          <p>この管理機能を利用する権限がありません。</p>
          <p>MEMBERの担当案件参照はPhase 6の割当実装後に対応します。</p>
        </section>
      )}
    </ProtectedRoute>
  );
}
