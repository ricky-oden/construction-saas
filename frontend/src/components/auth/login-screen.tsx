"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";

export function LoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requested = searchParams.get("next");
  const destination =
    requested?.startsWith("/") && !requested.startsWith("//")
      ? requested
      : "/account";

  return (
    <main className="page-stack narrow-page">
      <section className="panel" aria-labelledby="login-title">
        <p className="eyebrow">CONSTRUCTION-V1 · Phase 3</p>
        <h1 id="login-title">ログイン</h1>
        <p>学習用のdemoアカウントで認証します。</p>
        <LoginForm onSuccess={() => router.replace(destination)} />
      </section>
    </main>
  );
}
