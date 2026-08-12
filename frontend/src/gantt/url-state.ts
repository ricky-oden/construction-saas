import { isDateKey, todayInTokyo, type GanttMode } from "@/gantt/date-geometry";

export type GanttUrlState = { mode: GanttMode; anchor: string };

export function ganttStateFromUrl(
  params: URLSearchParams,
  today = todayInTokyo(),
): GanttUrlState {
  const mode = params.get("mode") === "week" ? "week" : "month";
  const candidate = params.get("anchor");
  return { mode, anchor: isDateKey(candidate) ? candidate : today };
}

export function ganttStateToUrl(state: GanttUrlState): string {
  const params = new URLSearchParams({
    mode: state.mode,
    anchor: state.anchor,
  });
  return params.toString();
}
