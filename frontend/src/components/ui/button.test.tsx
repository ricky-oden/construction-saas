import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "./button";

describe("Button", () => {
  it("is disabled and exposes its disabled label", () => {
    render(<Button disabled>保存できません</Button>);

    expect(
      screen.getByRole("button", { name: "保存できません" }),
    ).toBeDisabled();
  });

  it("is disabled and uses an explicit loading label while loading", () => {
    render(<Button loading>保存</Button>);

    expect(screen.getByRole("button", { name: "処理中です…" })).toBeDisabled();
  });
});
