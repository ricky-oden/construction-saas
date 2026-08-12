# Implementation Status

PLAN_VERSION: `CONSTRUCTION-V1.0`

Current phase: Phase 3 — authentication and authorization foundation implemented and verified; review pending.

## Product requirement status

Phases 1 and 2 are complete and Phase 3 authentication infrastructure is implemented. Requirements spanning later phases remain partial or not implemented. No Customer/Property/Project model or API, project assignment, audit history, Gantt, Kanban, or CI workflow exists.

| Requirement group | Status | Verification |
|---|---|---|
| ENV | PARTIAL | Node/Python/PostgreSQL patches, lockfiles, dependency separation, Docker Compose, nonroot runtime, DB separation, and migration checks verified; CI remains Phase 9 |
| UI | PARTIAL | Shared shell, states, button, and React Hook Form foundation verified; business usage remains later-phase |
| API | PARTIAL | Common error envelope, DB error handler, DB-backed health, and same-origin proxy verified; business errors and 409 metadata remain later-phase |
| AUTH | PARTIAL | Login/logout/me, Argon2id, hashed opaque sessions, expiry, inactive-user checks, three roles, backend role dependency, and frontend auth foundation verified; resource authorization remains later-phase |
| DATA | PARTIAL | SQLAlchemy infrastructure and User/AuthTokenSession/optional Assignee relationship verified; Customer/Property/Project and project assignment are not implemented |
| PRJ | NOT_IMPLEMENTED | Not run |
| SEARCH | NOT_IMPLEMENTED | Not run |
| STATUS | NOT_IMPLEMENTED | Not run |
| GANTT | NOT_IMPLEMENTED | Not run |
| KANBAN | NOT_IMPLEMENTED | Not run |
| CACHE | NOT_IMPLEMENTED | Not run |
| AUDIT | NOT_IMPLEMENTED | Not run |
| ARCH | NOT_IMPLEMENTED | Not run |
| TEST | PARTIAL | 18 frontend jsdom tests and 23 backend PostgreSQL tests passed; real-browser and business suites remain later-phase |

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

- Customer, Property, Project, project assignment, business APIs, status, audit, Gantt, or Kanban
- GitHub Actions
- Phase 3 commit, push, pull request, or deployment

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
