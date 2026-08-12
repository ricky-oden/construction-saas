import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";

import { AuthProvider } from "@/auth/auth-provider";
import { AUTH_TOKEN_STORAGE_KEY } from "@/auth/storage";
import { LoginForm } from "@/components/auth/login-form";

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

it("preserves input after an API error", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      jsonResponse(401, {
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Email or password is incorrect.",
          field_errors: [],
          conflict: null,
        },
      }),
    ),
  );
  render(
    <AuthProvider>
      <LoginForm onSuccess={vi.fn()} />
    </AuthProvider>,
  );
  const email = screen.getByRole("textbox", { name: "メールアドレス" });
  const password = screen.getByLabelText("パスワード");
  await userEvent.type(email, "member@example.com");
  await userEvent.type(password, "wrong-password");
  await userEvent.click(screen.getByRole("button", { name: "ログイン" }));

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Email or password is incorrect.",
  );
  expect(email).toHaveValue("member@example.com");
  expect(password).toHaveValue("wrong-password");
});

it("disables the submit button while login is pending and stores a successful token", async () => {
  let resolveRequest: ((value: Response) => void) | undefined;
  vi.stubGlobal(
    "fetch",
    vi.fn().mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveRequest = resolve;
      }),
    ),
  );
  const onSuccess = vi.fn();
  render(
    <AuthProvider>
      <LoginForm onSuccess={onSuccess} />
    </AuthProvider>,
  );
  await userEvent.type(
    screen.getByRole("textbox", { name: "メールアドレス" }),
    "admin@example.com",
  );
  await userEvent.type(screen.getByLabelText("パスワード"), "DemoAdmin123!");
  await userEvent.click(screen.getByRole("button", { name: "ログイン" }));

  expect(screen.getByRole("button", { name: "処理中です…" })).toBeDisabled();
  resolveRequest?.(
    jsonResponse(200, {
      token: "new-token",
      token_type: "bearer",
      expires_at: "2026-08-12T12:00:00Z",
      user: {
        id: 1,
        email: "admin@example.com",
        role: "ADMIN",
        assignee: null,
      },
    }),
  );
  await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  expect(window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBe("new-token");
});

it("shows required validation without calling the API", async () => {
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  render(
    <AuthProvider>
      <LoginForm onSuccess={vi.fn()} />
    </AuthProvider>,
  );

  await userEvent.click(screen.getByRole("button", { name: "ログイン" }));

  expect(await screen.findAllByRole("alert")).toHaveLength(2);
  expect(fetchMock).not.toHaveBeenCalled();
});
