# Implementation Status

PLAN_VERSION: `CONSTRUCTION-V1.0`

Current phase: Phase 4 — Customer/Property/Project vertical slice implemented and verified; review pending.

## Product requirement status

Phases 1–3 are complete and the Phase 4 business-core vertical slice is implemented. Requirements spanning later phases remain partial or not implemented. No project assignment, version conflict, status transition service, audit history, advanced search/cache, Gantt, Kanban, or CI workflow exists.

| Requirement group | Status | Verification |
|---|---|---|
| ENV | PARTIAL | Node/Python/PostgreSQL patches, lockfiles, dependency separation, Docker Compose, nonroot runtime, DB separation, and migration checks verified; CI remains Phase 9 |
| UI | PARTIAL | Shared states and React Hook Form are used by nine Phase 4 CRUD routes; later search/Gantt/Kanban UI remains |
| API | PARTIAL | Stable auth/validation/not-found/duplicate/reference/server errors verified; Phase 6 conflict metadata remains |
| AUTH | PARTIAL | ADMIN/MANAGER business management and direct MEMBER 403 verified; MEMBER assigned-project scope waits for Phase 6 |
| DATA | PARTIAL | Customer/Property/Project cardinality, date, unique code, and reference constraints verified; project assignment remains unimplemented |
| PRJ | PARTIAL | Customer, Property, and Project list/create/detail/update verified; assignee management and multiple assignment remain |
| SEARCH | NOT_IMPLEMENTED | Not run |
| STATUS | NOT_IMPLEMENTED | Not run |
| GANTT | NOT_IMPLEMENTED | Not run |
| KANBAN | NOT_IMPLEMENTED | Not run |
| CACHE | NOT_IMPLEMENTED | Not run |
| AUDIT | NOT_IMPLEMENTED | Not run |
| ARCH | PARTIAL | is_active/is_archived lifecycle and default-list exclusion verified; final reactivation/reference policy remains unresolved |
| TEST | PARTIAL | 26 frontend jsdom tests and 39 backend PostgreSQL tests passed; real-browser and later business suites remain |

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

## Prohibited until explicit follow-up approval

- Search/sort/pagination/cache, project assignment, version conflicts, status transitions, audit, Gantt, or Kanban
- GitHub Actions
- Phase 4 commit, push, pull request, or deployment

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
