# Implementation Status

PLAN_VERSION: `CONSTRUCTION-V1.0`

Current phase: Phase 9 — cross-layer E2E, manual CI, hydration correction, traceability, and learning documentation implemented and locally verified; review pending.

## Product requirement status

Phases 1–8 are committed and pushed. Phase 9 is implemented and locally verified in the unstaged worktree. The manual GitHub Actions workflow is statically verified but has not been run remotely.

| Requirement group | Status | Verification |
|---|---|---|
| ENV | COMPLETE | Fixed runtimes, lockfiles, dependency separation, Compose, nonroot runtime, DB separation, migration/build checks, reproducible script, and manual-only workflow structure verified locally |
| UI | COMPLETE | Shared states/forms, URL-backed search, workflow/history controls, Gantt, Kanban, hydration-safe auth restoration, and standalone Assignee management verified |
| API | COMPLETE | Stable authentication, authorization, validation, not-found, duplicate/reference, 409 conflict, and safe server errors verified |
| AUTH | COMPLETE | Role, assignment, operation, direct-API, and assigned MEMBER authorization verified in backend |
| DATA | COMPLETE | Core cardinalities, constraints, Assignee/User link, and unique ProjectAssignee relation verified |
| PRJ | COMPLETE | Project/Customer/Property/Assignee management and multiple-assignment workflow verified through API, component, PostgreSQL, and browser tests |
| SEARCH | COMPLETE | Name/assignee/status/customer/property/period filters, fixed sorting, pagination, URL/query keys, and stale-result behavior verified |
| STATUS | COMPLETE | Exact transition matrix, role/assignment rules, locked expected-version writes, increments, concurrent conflict, and 409 verified |
| GANTT | COMPLETE | Month/week ranges, Monday week, Asia/Tokyo today, inclusive clipping, fixed pixel geometry, scroll, URL state, roles, status/detail links verified |
| KANBAN | COMPLETE | Six ordered columns, authorized cards/actions, immediate movement, server version settlement, error rollback, conflict display, and refetch verified |
| CACHE | COMPLETE | Parameterized query keys plus shape-checked Kanban/list/detail/Gantt/history snapshot, update, rollback, and settled invalidation verified |
| AUDIT | COMPLETE | Basic-field/date/status/assignment/archive audit values, actor/version/time, authorized history, and transaction rollback verified |
| ARCH | COMPLETE | `is_active`/`is_archived`, no physical-delete API, default exclusion, inactive-reference preservation, and assignment history behavior verified within approved rules |
| TEST | COMPLETE | 86 frontend jsdom tests, 112 backend PostgreSQL tests, and 8 saved Chromium E2E tests passed; manual workflow is statically verified and remote-unexecuted |

## Documentation status

- Initial `CONSTRUCTION-V1.0` planning set: approved as the initial authoritative baseline
- Career material comparison: completed
- `CAREER-SYSTEMS-V1` comparison: completed

## Phase 1 verification — 2026-08-12

- Frontend Node.js 22.23.2 temporary container: 9 tests passed; ESLint, Prettier check, TypeScript check, and Next.js production build passed.
- Backend bundled Python 3.12.13 venv: 4 tests passed; Ruff lint and format check passed.
- Development server smoke checks: Next.js `/` and FastAPI `/api/v1/health` returned 200 over real local TCP.
- Automated frontend tests use jsdom, not a real browser.
- Automated backend tests use in-process FastAPI TestClient, not a live TCP server.
- No automated Phase 1 test uses PostgreSQL or another database.
- Final verification produced no test skips, xfails, TODO markers, or quality-command warnings.
- Informational notices: npm 10.9.8 reported that npm 12 is available; the first Next.js start/build displayed its anonymous telemetry notice.

## Phase 2 verification — 2026-08-12

- Compose config/build/up with healthy frontend, backend, PostgreSQL 16.14 development DB, and tmpfs test DB passed.
- Next.js same-origin `/api/v1/health` returned process and DB success; PostgreSQL has no host-published port.
- Development and test DB identities were verified as `construction_saas`/`construction_app` and `construction_saas_test`/`construction_test` on their intended hosts and port 5432.
- 9 frontend tests passed; ESLint, Prettier check, TypeScript check, and production build passed.
- 11 backend tests passed; Ruff lint/format check and Alembic upgrade/current/check passed against a clean test DB.
- Missing, malformed, non-PostgreSQL, incomplete, and non-`_test` test URLs are rejected before app import. A stopped test DB returned the safe 503 envelope without falling back to the development DB.
- Frontend runs as UID 1000 (`node`); backend development and production targets run as UID 10001 (`app`).
- The backend production target does not contain pytest, Ruff, or the test HTTP client.
- No baseline revision was created: Phase 2 has empty metadata and no business schema to migrate.

## Current gate

- Phase 9 staging, commit, push, PR, deployment, remote workflow execution, and automatic GitHub Actions triggers require explicit follow-up approval.

## Phase 4 verification — 2026-08-12

- Customer, Property, and Project PostgreSQL models/migration and list/create/detail/update APIs passed.
- Unique customer/project codes, project date order, and property/customer pairing are enforced by PostgreSQL and API/service checks.
- New projects reject inactive customers/properties and mismatched pairs; existing project details and ordinary non-reference updates retain inactive historical references.
- Project creation defaults to `DRAFT`, version 1, and not archived. Status mutation and version-conflict behavior remain Phase 6.
- ADMIN and MANAGER management calls passed; unauthenticated requests return 401 and MEMBER direct API requests return 403.
- Nine frontend routes provide loading/error/empty, validation, submitting-disabled, and recoverable form behavior.
- 26 frontend jsdom tests and 39 backend PostgreSQL tests passed. Next.js proxy CRUD and MEMBER 403 passed over container TCP.
- Phase 4 migration upgrade/downgrade/current/check passed on PostgreSQL 16.14.

## Phase 3 verification — 2026-08-12

- Argon2id password hashes and eight-hour opaque-token sessions passed against PostgreSQL 16.14.
- Only SHA-256 token hashes are persisted; raw tokens exist only in the login response and frontend localStorage.
- Re-login invalidates the old token, logout revokes the current token, and invalid/revoked/expired/inactive-user tokens return the unified 401 envelope.
- `/auth/me` and backend ADMIN/MANAGER/MEMBER role dependencies distinguish 401 from 403.
- User and Assignee use an optional one-to-one relationship; Project assignment remains unimplemented.
- The four-user demo seed, including inactive and assignee-linked identities, remained at four users/two assignees after two runs.
- Next.js same-origin login→me→logout was verified over real container TCP.
- 18 frontend tests and 23 backend tests passed; lint, format, typecheck, build, migration upgrade/current/check passed.
- Frontend tests use jsdom rather than a real browser; Playwright remains unimplemented.

## Phase 5 verification — 2026-08-12

- Project list implements case-insensitive name, status, customer, property, and inclusive/one-sided date-overlap filters. `assignee_id` is rejected and remains Phase 6.
- Fixed SQLAlchemy sort mapping covers code, name, start/end dates, and created/updated timestamps with stable ID ordering. Page defaults are 1/20 with maximum 100.
- Customer, Property, and Project lists share `items`, `page`, `page_size`, `total`, and `total_pages`.
- Frontend URL restoration, submitted fields, immediate select/sort/page controls, reset, current-condition text, pagination, stale-result suppression, and cache policy are covered in jsdom.
- 43 frontend tests passed in the approved Node 22.23.2 container; ESLint, Prettier check, TypeScript check, and the dedicated Node 22.23.2 Next.js production build stage passed.
- 68 backend tests passed against PostgreSQL 16.14, including each filter independently and both directions for all sort columns. Ruff lint and format check passed.
- Alembic upgrade/current/check passed at `20260812_02`; Next.js same-origin login plus Project pagination and invalid-period validation passed over real TCP.
- No Playwright suite was added or run; browser coverage remains part of the later TEST-001 work.

## Phase 6 verification — 2026-08-12

- ProjectAssignee enforces a unique Project/Assignee pair; inactive assignees are rejected for new assignment while retained historical references remain readable.
- MEMBER list/detail/history and status operations are backend-restricted to assigned projects. Customer/Property/Assignee management, basic edits, assignment changes, archive, cancellation, and unassigned projects are denied.
- All ten approved transitions passed for ADMIN and MANAGER; the four approved MEMBER transitions and representative prohibited/terminal transitions passed.
- Basic update, assignment replacement, transition, and archive require `expected_version`, lock the Project row, increment once on success, and return structured 409 metadata on stale requests. A concurrent pair produced one success and one conflict.
- Basic-field/date, status, assignment, and archive audits include actor, before/after JSON, resulting version, and occurrence time. Forced audit failure rolled back the business mutation in the same transaction.
- `assignee_id` is included in backend search, frontend URL state, and every result-changing Project query key.
- 107 backend tests passed against the isolated PostgreSQL 16.14 test DB; 46 frontend jsdom tests passed. Ruff, ESLint, Prettier, and TypeScript checks passed.
- Alembic development and test DB checks passed at `20260812_03`; test DB downgrade to `20260812_02` and re-upgrade passed. Node.js 22.23.2 production build passed.
- Next.js same-origin real-TCP smoke passed for ADMIN assignment, assigned MEMBER list/detail, `PLANNED → IN_PROGRESS`, and history.
- No skip, xfail, warning, or TODO was reported by the final commands. Playwright, Gantt, Kanban, GitHub Actions, and production deployment were not run or implemented.

## Phase 7 verification — 2026-08-12

- `/schedule` reuses `GET /api/v1/projects` with inclusive visible bounds, stable `start_date asc, id asc` ordering, existing backend role/assignment scope, and pagination through every result page.
- Pure functions generate current-month and Monday/Sunday-week ranges, navigate calendar units, intersect and clip ranges, count inclusive days, and calculate fixed pixel offset/width without DOM or viewport input.
- The frontend restores `mode`/`anchor` URL state, switches month/week, moves previous/next, returns to Asia/Tokyo today, shows loading/error/empty and status, scrolls horizontally, and links labels/bars to authorized Project detail.
- Boundary coverage includes month end/crossing, year crossing, leap day, weekends, one-day projects, equal endpoints, both-side clipping, and fully outside projects.
- 65 frontend jsdom tests and 110 backend PostgreSQL 16.14 tests passed. ESLint, Prettier, TypeScript, Ruff, Node.js 22.23.2 production build, Compose health, Alembic, same-origin API, and diff checks passed.
- Interactive real-browser verification passed for demo ADMIN login → current-month Gantt → Project detail. No repository Playwright test was added.
- GitHub Actions, production deployment, process/task bars, holidays, and repository Playwright remain absent.

## Phase 8 verification — 2026-08-12

- `/kanban` loads every authorized active-scope Project through the existing paginated list API, presents `DRAFT`, `PLANNED`, `IN_PROGRESS`, `ON_HOLD`, `COMPLETED`, and `CANCELLED` in fixed order, preserves stable backend ordering within columns, and links each card to Project detail.
- Cards show status, inclusive date range, assignees, and version. Explicit move buttons use the shared approved transition matrix; MEMBER receives only assigned Projects from FastAPI and sees only the four approved transition edges.
- The shared TanStack Query mutation cancels affected queries and snapshots Kanban, every Project list shape, Project detail, Gantt, and history. It performs the immediate move with the operation-start version, applies the backend response on success, fully restores snapshots for 401/403/409/422/network/5xx, displays categorized errors, and invalidates/refetches all affected families in `onSettled`.
- No Kanban-specific write endpoint, duplicate backend transition rule, dependency, migration, or business table was added. The Phase 6 locked row/version, role/assignment checks, transition service, and status/AuditLog transaction remain authoritative.
- 82 frontend jsdom tests passed in Node.js 22.23.2. Deferred requests cover pre-response movement, version settlement, double-operation prevention, rollback categories and rollback-before-401-auth-clear ordering, server-winner refetch, multiple Project-list cache consistency, Gantt status cache, history invalidation, loading/error/empty, and detail links.
- 112 backend tests passed against isolated PostgreSQL 16.14. Added cases directly verify concurrent status transitions yield one success and one 409 without overwriting the winner, and forced audit insertion failure rolls back status, version, and history.
- ESLint, Prettier check, TypeScript check, Ruff lint/format check, Node.js 22.23.2 production build, Compose config/build/health, development and test Alembic `current`/`check` at `20260812_03`, development `upgrade head`, and Next.js same-origin health passed.
- Interactive browser smoke passed for MANAGER login → `/kanban` → `IN_PROGRESS → ON_HOLD` → version 5 and Project-detail `STATUS_CHANGED` history, followed by MEMBER assigned-only board/control verification. Forced browser failure and stale-409 injection were not run; deterministic frontend/backend tests cover them.
- Final test commands reported no skip or xfail. One development-browser hydration warning from the existing AuthProvider initial localStorage-dependent state remains; production build and automated tests pass. No repository Playwright suite or GitHub Actions workflow exists.

## Phase 9 verification — 2026-08-12

- AuthProvider now renders the same explicit loading state on the server and first client render, restores localStorage authentication only after mount, and protects routes until restoration completes. Vitest hydration and Chromium console checks found no hydration warning.
- `/assignees` provides ADMIN/MANAGER registration and display-name/active-state update using the existing APIs; create payloads for Customer/Property omit update-only `is_active` fields.
- The saved Playwright suite ran 8/8 Chromium tests against the Node.js 22 production Next.js target, same-origin rewrite, real FastAPI, SQLAlchemy, and isolated PostgreSQL 16.14 test DB. It covers login/search/detail/logout, management CRUD, URL search controls, Gantt, Kanban success/rollback/409, MEMBER scope/direct API denial, and assignment history.
- `scripts/verify-phase9.sh` passed from a clean isolated Compose project: Alembic downgrade-to-base/full-upgrade/current/check/downgrade/re-upgrade; 112 pytest; Ruff lint/format; 86 Vitest; ESLint; Prettier; TypeScript; Node.js 22 production build; seed twice; 8 Playwright; same-origin health; nonroot users; and production backend dependency separation.
- The E2E frontend uses the production target with a build-time internal rewrite to `backend:8000`, no source mount, and no development-DB dependency. The backend points only to tmpfs `test-db`; cleanup removed the isolated project and its temporary resources.
- The normal development Compose config/build/up/health passed for frontend, backend, db, and test-db. Direct and same-origin health returned `status=ok,database=ok`; backend connected to `db:5432/construction_saas` as `construction_app`; Alembic was `20260812_03 (head)` with no differences. Services were then stopped while retaining the development named volume.
- `.github/workflows/manual-quality.yml` is `workflow_dispatch` only, read-only, concurrent/cancelable, time-bounded, secret-free, non-deploying, and calls the same local script. Its structure and commands were statically verified; no remote workflow run occurred.
- Final automated commands reported no skipped or xfailed tests. Informational npm notices reported that a newer npm major exists; the version-matched Playwright image uses its bundled Node 24 internally, while application production build/runtime remains fixed to Node.js 22.23.2.
