import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { expect, it, vi } from "vitest";

import { CustomerForm } from "@/components/business/customer-form";
import { businessKeys } from "@/business/query-keys";

const writeBusiness = vi.fn();

vi.mock("@/business/api", () => ({
  writeBusiness: (...args: unknown[]) => writeBusiness(...args),
}));

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

it("preserves customer input after an API failure", async () => {
  writeBusiness.mockImplementationOnce(() =>
    Promise.reject(new Error("保存APIが失敗しました。")),
  );
  render(<CustomerForm onSaved={vi.fn()} />, { wrapper });
  const code = screen.getByRole("textbox", { name: "顧客コード" });
  const name = screen.getByRole("textbox", { name: "顧客名" });
  await userEvent.type(code, "CUS-001");
  await userEvent.type(name, "入力を保持する顧客");
  await userEvent.click(screen.getByRole("button", { name: "保存" }));

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "保存APIが失敗しました。",
  );
  expect(code).toHaveValue("CUS-001");
  expect(name).toHaveValue("入力を保持する顧客");
});

it("disables the customer submit button while saving", async () => {
  let resolveRequest: ((value: object) => void) | undefined;
  writeBusiness.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
  );
  const onSaved = vi.fn();
  render(<CustomerForm onSaved={onSaved} />, { wrapper });
  await userEvent.type(
    screen.getByRole("textbox", { name: "顧客コード" }),
    "CUS-002",
  );
  await userEvent.type(
    screen.getByRole("textbox", { name: "顧客名" }),
    "送信中顧客",
  );
  await userEvent.click(screen.getByRole("button", { name: "保存" }));

  expect(screen.getByRole("button", { name: "処理中です…" })).toBeDisabled();
  resolveRequest?.({ id: 2 });
  await waitFor(() => expect(onSaved).toHaveBeenCalled());
});

it("updates the detail cache and invalidates customer lists after success", async () => {
  const saved = {
    id: 3,
    code: "CUS-003",
    name: "Cache Customer",
    contact_name: null,
    phone: null,
    email: null,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
  writeBusiness.mockResolvedValueOnce(saved);
  const client = new QueryClient();
  const invalidate = vi.spyOn(client, "invalidateQueries");
  render(
    <QueryClientProvider client={client}>
      <CustomerForm onSaved={vi.fn()} />
    </QueryClientProvider>,
  );
  await userEvent.type(
    screen.getByRole("textbox", { name: "顧客コード" }),
    saved.code,
  );
  await userEvent.type(
    screen.getByRole("textbox", { name: "顧客名" }),
    saved.name,
  );
  await userEvent.click(screen.getByRole("button", { name: "保存" }));

  await waitFor(() =>
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: businessKeys.customers.lists(),
    }),
  );
  expect(client.getQueryData(businessKeys.customers.detail(saved.id))).toEqual(
    saved,
  );
});
