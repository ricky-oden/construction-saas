"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";

import { useAuth } from "@/auth/auth-provider";
import { Button } from "@/components/ui/button";

type LoginFields = { email: string; password: string };

export function LoginForm({ onSuccess }: Readonly<{ onSuccess: () => void }>) {
  const { login } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFields>({ defaultValues: { email: "", password: "" } });

  const submit = handleSubmit(async ({ email, password }) => {
    setApiError(null);
    try {
      await login(email, password);
      onSuccess();
    } catch (error) {
      setApiError(
        error instanceof Error ? error.message : "ログインに失敗しました。",
      );
    }
  });

  return (
    <form onSubmit={submit} className="form-stack" noValidate>
      <label>
        メールアドレス
        <input
          type="email"
          autoComplete="username"
          aria-invalid={Boolean(errors.email)}
          {...register("email", {
            required: "メールアドレスを入力してください。",
          })}
        />
      </label>
      {errors.email && <p role="alert">{errors.email.message}</p>}

      <label>
        パスワード
        <input
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(errors.password)}
          {...register("password", {
            required: "パスワードを入力してください。",
          })}
        />
      </label>
      {errors.password && <p role="alert">{errors.password.message}</p>}
      {apiError && <p role="alert">{apiError}</p>}
      <Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
        ログイン
      </Button>
    </form>
  );
}
