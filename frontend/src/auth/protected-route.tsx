"use client";

import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";

import { useAuth } from "@/auth/auth-provider";

export function ProtectedRoute({
  children,
}: Readonly<{ children: ReactNode }>) {
  const { status } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [pathname, router, status]);

  if (status === "loading")
    return <p role="status">認証状態を確認しています。</p>;
  if (status === "unauthenticated")
    return <p role="status">ログイン画面へ移動します。</p>;
  return children;
}
