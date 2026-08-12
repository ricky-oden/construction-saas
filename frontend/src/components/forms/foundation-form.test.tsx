import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { FoundationForm } from "./foundation-form";

describe("FoundationForm", () => {
  it("accepts and preserves user input on submit", async () => {
    const user = userEvent.setup();
    render(<FoundationForm />);

    const input = screen.getByRole("textbox", { name: "確認用ラベル" });
    await user.type(input, "基盤確認");
    await user.click(screen.getByRole("button", { name: "入力を確認" }));

    expect(input).toHaveValue("基盤確認");
    expect(screen.getByRole("status")).toHaveTextContent(
      "「基盤確認」を確認しました。",
    );
  });

  it("shows a validation error when the required input is empty", async () => {
    const user = userEvent.setup();
    render(<FoundationForm />);

    await user.click(screen.getByRole("button", { name: "入力を確認" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "確認用ラベルを入力してください。",
    );
  });
});
