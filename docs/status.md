# Implementation Status

PLAN_VERSION: `CONSTRUCTION-V1.0`

Current phase: Phase 6 — assignment, transitions, optimistic locking, MEMBER scope, and audit implemented and verified; review pending.

## Product requirement status

Phases 1–5 are committed and complete, and Phase 6 is implemented and verified in the unstaged worktree. Requirements spanning Gantt, Kanban, Playwright, and CI remain partial or not implemented.

| Requirement group | Status | Verification |
|---|---|---|
| ENV | PARTIAL | Node/Python/PostgreSQL patches, lockfiles, dependency separation, Docker Compose, nonroot runtime, DB separation, and migration checks verified; CI remains Phase 9 |
| UI | PARTIAL | Shared states/forms, URL-backed search, assignment/status/history controls, pending state, and 409 reconciliation verified; Gantt/Kanban UI remains |
| API | COMPLETE | Stable authentication, authorization, validation, not-found, duplicate/reference, 409 conflict, and safe server errors verified |
| AUTH | COMPLETE | Role, assignment, operation, direct-API, and assigned MEMBER authorization verified in backend |
| DATA | COMPLETE | Core cardinalities, constraints, Assignee/User link, and unique ProjectAssignee relation verified |
| PRJ | PARTIAL | Project/Customer/Property flows and Project assignment UI verified; standalone Assignee management UI remains |
| SEARCH | COMPLETE | Name/assignee/status/customer/property/period filters, fixed sorting, pagination, URL/query keys, and stale-result behavior verified |
| STATUS | COMPLETE | Exact transition matrix, role/assignment rules, locked expected-version writes, increments, concurrent conflict, and 409 verified |
| GANTT | NOT_IMPLEMENTED | Not run |
| KANBAN | NOT_IMPLEMENTED | Not run |
| CACHE | PARTIAL | Search-key separation plus Project/list/detail/history invalidation and 409 refetch verified; Gantt/Kanban cache behavior remains |
| AUDIT | COMPLETE | Basic-field/date/status/assignment/archive audit values, actor/version/time, authorized history, and transaction rollback verified |
| ARCH | PARTIAL | is_active/is_archived lifecycle and default-list exclusion verified; final reactivation/reference policy remains unresolved |
| TEST | PARTIAL | 46 frontend jsdom tests and 107 backend PostgreSQL tests passed; Playwright and Gantt/Kanban suites remain |

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

- Phase 6 staging, commit, push, PR, and deployment require explicit follow-up approval.
- Phase 7 Gantt, Phase 8 Kanban, and Phase 9 Playwright/CI work are not authorized.

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
