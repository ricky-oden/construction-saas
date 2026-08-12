import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { expect, it, vi } from "vitest";

import { ProjectForm } from "@/components/business/project-form";

const writeBusiness = vi.fn();
vi.mock("@/business/api", () => ({
  businessApi: {
    customers: vi.fn().mockResolvedValue({
      items: [{ id: 1, code: "CUS-1", name: "Customer" }],
    }),
    properties: vi.fn().mockResolvedValue({
      items: [{ id: 2, customer_id: 1, name: "Property" }],
    }),
  },
  writeBusiness: (...args: unknown[]) => writeBusiness(...args),
}));

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

it("validates reversed project dates before calling the API", async () => {
  render(<ProjectForm onSaved={vi.fn()} />, { wrapper });
  await userEvent.type(
    screen.getByRole("textbox", { name: "案件コード" }),
    "PRJ-1",
  );
  await userEvent.type(screen.getByRole("textbox", { name: "案件名" }), "案件");
  await userEvent.selectOptions(
    await screen.findByRole("combobox", { name: "顧客" }),
    "1",
  );
  await userEvent.selectOptions(
    screen.getByRole("combobox", { name: "物件" }),
    "2",
  );
  await userEvent.type(screen.getByLabelText("開始日"), "2026-09-01");
  await userEvent.type(screen.getByLabelText("終了日"), "2026-08-01");
  await userEvent.click(screen.getByRole("button", { name: "保存" }));

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "開始日は終了日以前",
  );
  expect(writeBusiness).not.toHaveBeenCalled();
});
