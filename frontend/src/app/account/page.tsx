"use client";

import { useRouter } from "next/navigation";

import { ProtectedRoute } from "@/auth/protected-route";
import { RoleGate } from "@/auth/role-gate";
import { useAuth } from "@/auth/auth-provider";
import { Button } from "@/components/ui/button";

export default function AccountPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <ProtectedRoute>
      <main className="page-stack narrow-page">
        <section className="panel" aria-labelledby="account-title">
          <h1 id="account-title">認証済みアカウント</h1>
          <p>{user?.email}</p>
          <p>ロール: {user?.role}</p>
          <RoleGate allow={["ADMIN", "MANAGER"]}>
            <p>管理操作の表示基盤が有効です。</p>
          </RoleGate>
          <Button
            onClick={async () => {
              await logout();
              router.replace("/login");
            }}
          >
            ログアウト
          </Button>
        </section>
      </main>
    </ProtectedRoute>
  );
}
