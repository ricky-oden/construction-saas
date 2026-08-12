import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "./page";

describe("HomePage", () => {
  it("shows the current foundation top page", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { name: "建設業向け案件管理SaaS" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/顧客・物件・案件/)).toBeInTheDocument();
  });
});
