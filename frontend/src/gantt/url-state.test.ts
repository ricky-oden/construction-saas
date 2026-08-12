import { describe, expect, it } from "vitest";

import { ganttStateFromUrl, ganttStateToUrl } from "@/gantt/url-state";

describe("Gantt URL state", () => {
  it("restores valid mode and anchor", () => {
    expect(
      ganttStateFromUrl(new URLSearchParams("mode=week&anchor=2026-01-01")),
    ).toEqual({
      mode: "week",
      anchor: "2026-01-01",
    });
  });

  it("falls back to current month state for invalid values", () => {
    expect(
      ganttStateFromUrl(
        new URLSearchParams("mode=other&anchor=2026-02-30"),
        "2026-08-12",
      ),
    ).toEqual({ mode: "month", anchor: "2026-08-12" });
  });

  it("serializes both result-changing controls", () => {
    expect(ganttStateToUrl({ mode: "week", anchor: "2026-08-12" })).toBe(
      "mode=week&anchor=2026-08-12",
    );
  });
});
