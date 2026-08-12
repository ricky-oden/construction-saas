# Gantt Design

PLAN_VERSION: `CONSTRUCTION-V1.0`

Requirements: GANTT-001, GANTT-002

Status: `IMPLEMENTED_AND_VERIFIED`; review pending

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
- Start and end dates are inclusive.
- Include Saturday and Sunday without special compression or color semantics required by this plan.
- Today and default-anchor conversion use `Asia/Tokyo`; persisted project values remain date keys rather than instants.

## Navigation and sizing

- Initial state is the current Asia/Tokyo month.
- Month mode shows the first through last day and moves one calendar month.
- Week mode shows Monday through Sunday around the anchor and moves seven days.
- `mode` and `anchor` are stored in `/schedule` URL query state.
- Month columns are 40px per date and week columns are 96px per date. Width does not depend on viewport size; insufficient width scrolls horizontally.
- The frontend follows all API pages for the visible range and uses a dedicated Gantt cache key containing both period bounds.

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

## Remaining boundary

Holiday calendars and process/task-level bars remain explicitly out of scope.
