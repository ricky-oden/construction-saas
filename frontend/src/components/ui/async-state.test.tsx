import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AsyncState } from "./async-state";

describe("AsyncState", () => {
  it("shows loading text", () => {
    render(<AsyncState kind="loading" />);
    expect(screen.getByRole("status")).toHaveTextContent("読み込み中です。");
  });

  it("shows error text", () => {
    render(<AsyncState kind="error" />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "データを取得できませんでした。",
    );
  });

  it("shows empty text", () => {
    render(<AsyncState kind="empty" />);
    expect(
      screen.getByText("表示できるデータはありません。"),
    ).toBeInTheDocument();
  });
});
