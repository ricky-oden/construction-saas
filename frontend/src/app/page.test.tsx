import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "./page";

describe("HomePage", () => {
  it("shows the Phase 1 top page", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { name: "建設業向け案件管理SaaS" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/業務機能は後続Phase/)).toBeInTheDocument();
  });
});
