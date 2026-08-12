import { Suspense } from "react";

import { LoginScreen } from "@/components/auth/login-screen";

export default function LoginPage() {
  return (
    <Suspense fallback={<p role="status">ログイン画面を読み込んでいます。</p>}>
      <LoginScreen />
    </Suspense>
  );
}
