export type GanttMode = "month" | "week";

export type DateRange = {
  start: string;
  end: string;
};

export type BarGeometry = {
  left: number;
  width: number;
  clipped: DateRange;
};

const DAY_MS = 86_400_000;

function parseDateKey(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Invalid date key.");
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.valueOf()) || toDateKey(date) !== value) {
    throw new Error("Invalid date key.");
  }
  return date;
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(value: string, days: number): string {
  const date = parseDateKey(value);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateKey(date);
}

export function todayInTokyo(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function isDateKey(value: string | null): value is string {
  if (value === null) return false;
  try {
    parseDateKey(value);
    return true;
  } catch {
    return false;
  }
}

export function visibleRange(mode: GanttMode, anchor: string): DateRange {
  const date = parseDateKey(anchor);
  if (mode === "month") {
    const start = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1),
    );
    const end = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
    );
    return { start: toDateKey(start), end: toDateKey(end) };
  }
  const mondayOffset = (date.getUTCDay() + 6) % 7;
  const start = addDays(anchor, -mondayOffset);
  return { start, end: addDays(start, 6) };
}

export function moveAnchor(
  mode: GanttMode,
  anchor: string,
  amount: -1 | 1,
): string {
  const date = parseDateKey(anchor);
  if (mode === "month") {
    date.setUTCDate(1);
    date.setUTCMonth(date.getUTCMonth() + amount);
    return toDateKey(date);
  }
  return addDays(anchor, amount * 7);
}

export function inclusiveDays(start: string, end: string): number {
  const difference =
    parseDateKey(end).valueOf() - parseDateKey(start).valueOf();
  if (difference < 0) throw new Error("Date range is reversed.");
  return difference / DAY_MS + 1;
}

export function rangesIntersect(left: DateRange, right: DateRange): boolean {
  return left.start <= right.end && left.end >= right.start;
}

export function clipRange(
  project: DateRange,
  visible: DateRange,
): DateRange | null {
  if (!rangesIntersect(project, visible)) return null;
  return {
    start: project.start < visible.start ? visible.start : project.start,
    end: project.end > visible.end ? visible.end : project.end,
  };
}

export function dayOffset(start: string, value: string): number {
  return inclusiveDays(start, value) - 1;
}

export function barGeometry(
  project: DateRange,
  visible: DateRange,
  columnWidth: number,
): BarGeometry | null {
  if (columnWidth <= 0) throw new Error("Column width must be positive.");
  const clipped = clipRange(project, visible);
  if (clipped === null) return null;
  return {
    left: dayOffset(visible.start, clipped.start) * columnWidth,
    width: inclusiveDays(clipped.start, clipped.end) * columnWidth,
    clipped,
  };
}

export function dateColumns(range: DateRange): string[] {
  return Array.from(
    { length: inclusiveDays(range.start, range.end) },
    (_, index) => addDays(range.start, index),
  );
}
