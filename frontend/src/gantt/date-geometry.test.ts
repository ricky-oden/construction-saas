import { describe, expect, it } from "vitest";

import {
  barGeometry,
  clipRange,
  dateColumns,
  inclusiveDays,
  moveAnchor,
  rangesIntersect,
  todayInTokyo,
  visibleRange,
} from "@/gantt/date-geometry";

describe("Gantt date geometry", () => {
  it("builds full month ranges across month, year, and leap-day boundaries", () => {
    expect(visibleRange("month", "2026-01-31")).toEqual({
      start: "2026-01-01",
      end: "2026-01-31",
    });
    expect(visibleRange("month", "2026-12-31")).toEqual({
      start: "2026-12-01",
      end: "2026-12-31",
    });
    expect(visibleRange("month", "2024-02-29").end).toBe("2024-02-29");
  });

  it("builds Monday-to-Sunday weeks including a year boundary", () => {
    expect(visibleRange("week", "2026-01-01")).toEqual({
      start: "2025-12-29",
      end: "2026-01-04",
    });
  });

  it("moves month and week anchors by fixed calendar units", () => {
    expect(moveAnchor("month", "2026-01-31", 1)).toBe("2026-02-01");
    expect(moveAnchor("month", "2026-01-15", -1)).toBe("2025-12-01");
    expect(moveAnchor("week", "2026-01-01", 1)).toBe("2026-01-08");
  });

  it("counts both date endpoints, including a one-day project", () => {
    expect(inclusiveDays("2026-02-01", "2026-02-01")).toBe(1);
    expect(inclusiveDays("2024-02-28", "2024-03-01")).toBe(3);
  });

  it("recognizes boundary intersection and excludes outside ranges", () => {
    const visible = { start: "2026-03-01", end: "2026-03-31" };
    expect(
      rangesIntersect({ start: "2026-02-01", end: "2026-03-01" }, visible),
    ).toBe(true);
    expect(
      rangesIntersect({ start: "2026-04-01", end: "2026-04-02" }, visible),
    ).toBe(false);
  });

  it("clips projects extending before and after the visible range", () => {
    const visible = { start: "2026-03-01", end: "2026-03-31" };
    expect(
      clipRange({ start: "2026-02-01", end: "2026-03-10" }, visible),
    ).toEqual({
      start: "2026-03-01",
      end: "2026-03-10",
    });
    expect(
      clipRange({ start: "2026-03-20", end: "2026-04-10" }, visible),
    ).toEqual({
      start: "2026-03-20",
      end: "2026-03-31",
    });
  });

  it("calculates inclusive pixel positions without viewport input", () => {
    const geometry = barGeometry(
      { start: "2026-03-03", end: "2026-03-05" },
      { start: "2026-03-01", end: "2026-03-31" },
      40,
    );
    expect(geometry).toMatchObject({ left: 80, width: 120 });
  });

  it("returns no geometry for an outside project", () => {
    expect(
      barGeometry(
        { start: "2026-02-01", end: "2026-02-28" },
        { start: "2026-03-01", end: "2026-03-31" },
        40,
      ),
    ).toBeNull();
  });

  it("generates every visible date including weekends", () => {
    expect(dateColumns({ start: "2026-08-08", end: "2026-08-10" })).toEqual([
      "2026-08-08",
      "2026-08-09",
      "2026-08-10",
    ]);
  });

  it("uses Asia/Tokyo for today's date key", () => {
    expect(todayInTokyo(new Date("2026-01-01T15:30:00Z"))).toBe("2026-01-02");
  });
});
