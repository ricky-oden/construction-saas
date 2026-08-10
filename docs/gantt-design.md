# Gantt Design

PLAN_VERSION: `CONSTRUCTION-V1.0`

Requirements: GANTT-001, GANTT-002

Status: `NOT_IMPLEMENTED`

## Scope

- One bar per project
- Date precision only; no time-of-day calculations
- Month and week views
- Weekends included as normal visible dates
- No holiday calculation
- No process/task-level bars

## Responsibility split

### Backend

- Return authorized projects with stable IDs, names, status, start date, end date, and version.
- Validate persisted project date rules.
- Filter projects by the requested visible/search period using the approved overlap semantics.
- Never return pixel positions.

### Frontend pure functions

- Generate visible calendar units for month/week mode.
- Intersect a project date range with the visible date range.
- Clip bars starting before or ending after the visible range.
- Convert day offsets and inclusive duration into left position and width.
- Keep calculations independent of React components and browser DOM.

### React components

- Render headers, grid, rows, and bars from calculated values.
- Switch month/week mode and move the visible range.
- Preserve search/filter context as designed by SEARCH-001 and CACHE-001.
- Navigate from a project bar to authorized project detail.

## Date rules

- Persist and exchange ISO dates (`YYYY-MM-DD`).
- Decide and document the inclusive/exclusive end-date display convention before calculation implementation; persisted values remain date-based.
- Include Saturday and Sunday without special compression or color semantics required by this plan.
- Use a consistent calendar timezone for converting any browser values to date keys; the exact policy is unresolved because domain values are dates rather than instants.

## Pure-function examples

The implemented names may differ, but the responsibilities should resemble:

- `buildMonthColumns(visibleRange)`
- `buildWeekColumns(visibleRange)`
- `intersectDateRanges(projectRange, visibleRange)`
- `calculateBarGeometry(clippedRange, visibleRange, columnWidth)`

## Test boundaries

- Same-day project
- Start/end exactly at visible boundary
- Starts before or ends after visible range
- Fully outside visible range
- Month and year rollover
- Week and year rollover
- Leap day
- Weekend-spanning project
- Invalid reversed date range rejected before rendering

## Unresolved details

- Initial visible range
- Week-start day
- Exact month/week column width and responsive behavior
- Date-overlap query semantics
- Whether dates are mandatory at project creation
- Inclusive/exclusive end-date display convention
