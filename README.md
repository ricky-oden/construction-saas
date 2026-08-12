# Construction Project SaaS

Project ID: `CONSTRUCTION-V1`

Plan version: `CONSTRUCTION-V1.0`

Implementation status: Phase 9 implemented and locally verified; review/commit approval pending

This repository is a learning implementation of a construction-industry project management SaaS. It is intended to make the work history described in the career material traceable from the browser through the API and ORM to PostgreSQL.

## Planned scope

- Project, customer, property, and assignee management
- Search, filtering, sorting, and pagination
- Multiple assignees per project
- Role- and project-status-based authorization
- Project-level monthly and weekly Gantt views
- Kanban status changes with optimistic update and rollback
- Audit history for project fields, status, dates, and assignments

## Technology and fixed runtime

- Frontend: Node.js 22, Next.js App Router, React, TypeScript, TanStack Query, React Hook Form
- Backend: Python 3.12, FastAPI, SQLAlchemy, Alembic
- Database: PostgreSQL 16
- Tests: Vitest, React Testing Library, Playwright, pytest
- Environment: Docker Compose, npm
- CI: GitHub Actions manual `workflow_dispatch` only (structure locally verified; remote run not performed)

The project uses Node.js `22.23.2`, npm `10.9.8`, Python `3.12.13`, and PostgreSQL `16.14`. Frontend direct dependencies are fixed in `frontend/package.json`, the complete npm graph is fixed in `frontend/package-lock.json`, and backend packages are fixed in separate runtime and development/test requirement files.

## Frontend commands

Prerequisites: Node.js `22.23.2` and npm `10.9.8`.

```bash
cd frontend
npm ci
npm run dev
npm test
npm run test:e2e
npm run lint
npm run format
npm run format:check
npm run typecheck
npm run build
```

The development server uses `http://localhost:3000` by default. `npm test` uses jsdom and React Testing Library; `npm run test:e2e` uses saved Playwright tests and requires the documented E2E Compose stack rather than the standalone development server.

## Backend commands

Prerequisite: Python `3.12.13`.

Create the local environment and install runtime dependencies only:

```bash
cd backend
python3.12 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
```

Install development/test dependencies. This file includes the runtime requirements and then adds pytest, Ruff, and the HTTP test stack:

```bash
.venv/bin/python -m pip install -r requirements-dev.txt
```

Run the development server and quality commands:

```bash
.venv/bin/uvicorn app.main:app --reload --host 127.0.0.1 --port 8002
.venv/bin/pytest
.venv/bin/ruff check .
.venv/bin/ruff format .
.venv/bin/ruff format --check .
```

Set `DATABASE_URL` before starting Uvicorn. The health endpoint is `GET http://127.0.0.1:8002/api/v1/health` and verifies both the process and PostgreSQL with `SELECT 1`.

## Docker Compose development

Copy the learning-only demo values, then build and start the stack:

```bash
cp .env.example .env
docker compose config --quiet
docker compose build
docker compose up -d --wait
```

The Compose project name is `construction-project-saas`. Open the frontend at `http://localhost:3000`; browser API calls use the same-origin `/api/v1` path, which Next.js forwards to `http://backend:8000` inside the Compose network. For a backend running outside Docker, set `BACKEND_INTERNAL_URL=http://localhost:8002` before starting Next.js. The backend is also available to the host at port `8002`. PostgreSQL has no host-published port.

The persistent development database is `construction_saas`. The isolated `construction_saas_test` database runs only with the `test` profile and stores data in tmpfs:

```bash
docker compose --profile test up -d --wait test-db
docker compose exec -T \
  -e TEST_DATABASE_URL=postgresql+psycopg://construction_test:construction_test_demo_password@test-db:5432/construction_saas_test \
  backend pytest
```

Tests reject a missing/invalid test URL or a database name that does not end in `_test`; they never fall back to the development DB.

Alembic shares backend settings. Phase 3 adds authentication, Phase 4 adds the business core, and Phase 6 adds project assignment and audit history:

```bash
docker compose exec -T backend alembic upgrade head
docker compose exec -T backend alembic current
docker compose exec -T backend alembic check
docker compose exec -T backend python -m app.db.seed
```

The seed command is idempotent and uses the learning-only passwords from `.env`. Demo login IDs are `admin@example.com`, `manager@example.com`, `member@example.com`, and inactive `inactive@example.com`; their example passwords are documented only in `.env.example`. The login UI is at `http://localhost:3000/login`, and `/account` demonstrates protected-route, role-gate, and logout behavior.

ADMIN and MANAGER can manage customers, properties, projects, and assignees. MEMBER cannot use those general-management operations, but can list, open, and view history for assigned projects and perform only the approved assigned-project transitions.

The Project list synchronizes submitted name/date conditions and immediately changed select/sort/page controls with the URL. It supports status, customer, property, assignee, inclusive date-overlap, fixed-column sorting, and pagination. Browser history and reload restore the URL-backed conditions. MEMBER results are additionally restricted by backend assignment scope.

Project detail holds the current integer version. ADMIN/MANAGER can replace the assignee set, perform every approved status transition, update basic fields, and archive. MEMBER sees only permitted status actions for an assigned project. Every protected write requires `expected_version`; a stale request returns 409 conflict metadata, triggers a server-state refetch in the frontend, and changes neither business data nor audit history.

The protected `/schedule` screen renders one date-precision bar per authorized Project. It defaults to the current Asia/Tokyo month, supports month and Monday-start week views, stores mode/anchor in the URL, uses inclusive date endpoints, clips overhanging bars, and keeps fixed day widths inside a horizontally scrollable table. Project bars link to Project detail. It reuses `GET /api/v1/projects` with the existing inclusive period overlap and MEMBER assignment scope; the backend never calculates pixels.

The protected `/kanban` screen loads every authorized, non-archived Project through the existing paginated list API and shows the six canonical status columns. Explicit move buttons expose only the role-appropriate transition candidates, but FastAPI remains authoritative. A shared TanStack Query mutation cancels affected queries, snapshots Kanban, Project list/detail, Gantt, and history caches, moves the card immediately, applies the server status/version on success, restores every snapshot on 401/403/409/422/network/5xx failure, and invalidates/refetches server state in `onSettled`. It reuses the Phase 6 status-transition API and adds no Kanban-specific write endpoint or migration.

The protected `/assignees` screen completes the approved standalone management path. ADMIN/MANAGER can register an Assignee for an existing User ID and update display name/active state; physical deletion is not offered.

## Reproducible full verification

Copy the learning-only environment and run the Phase 9 command from the repository root:

```bash
cp .env.example .env
scripts/verify-phase9.sh
```

The script uses the separate Compose project `construction-project-saas-e2e`, binds its frontend/backend to host ports 3010/8010, points the backend exclusively at the tmpfs `_test` database, rebuilds/migrates/tests/seeds it, runs Vitest/pytest/Playwright and quality/build checks, and removes only that isolated project's volumes on exit. Playwright runs Chromium from the version-matched official image. Screenshots are retained only on failure; trace and video are disabled so failure artifacts do not persist Bearer headers. Generated reports are ignored by Git.

The verified local result is 112 pytest tests against PostgreSQL 16.14, 86 Vitest/RTL tests, and 8 Playwright Chromium tests. The same script is referenced by `.github/workflows/manual-quality.yml`. That workflow has only a manual trigger and has been statically inspected; it has not been run remotely.

## Authentication security boundary

Passwords are hashed with Argon2id. Login returns a random opaque token with an eight-hour lifetime; PostgreSQL stores only its SHA-256 hash. A partial unique index permits one unrevoked session per user; re-login revokes the previous row before creating the new session. Inactive users cannot log in or use an existing token.

The frontend stores the raw Bearer token in localStorage only for this learning project. JavaScript running on the same origin can read localStorage, so an XSS vulnerability could steal the token. This is not presented as a production-grade session-storage design. Avoid unsafe HTML injection and do not place real credentials or tokens in repository files.

`backend/Dockerfile` separates the development/test target from the production runtime target; pytest, Ruff, and the test HTTP client are absent from production. The frontend Dockerfile similarly separates dependency, development, build, and production stages. These are local image targets, not a production deployment design.

## Current structure

```text
frontend/
  src/app/                  Next.js App Router layout, top page, 404, global CSS
  src/components/           app shell, common states/button, minimal form
  src/auth/                 token storage, AuthProvider, guards and roles
  src/business/             Customer/Property/Project API types and client
  src/gantt/                pure date/range/pixel calculations and URL state
  src/kanban/               transition policy, cache snapshots, optimistic mutation
  e2e/                      saved Chromium critical flows against the real stack
  src/lib/api/              API client and shared error types
  src/providers/            TanStack Query provider
backend/
  app/api/                  v1 router, health route, shared errors
  app/core/                 settings
  app/db/                   lazy SQLAlchemy engine/session and test DB guard
  app/auth/                 password/token service and authorization dependencies
  app/models/               Auth, business core, assignment, and audit models
  app/services/             CRUD, search, assignment, transition, version, audit rules
  alembic/                  Auth, business-core, and Phase 6 workflow revisions
  tests/                    infrastructure through Phase 6 PostgreSQL workflows
```

## Documentation

Start with:

- `docs/implementation-plan.md`
- `docs/requirements.md`
- `docs/system-overview.md`
- `docs/status.md`
- `docs/decision-log.md`

Detailed plans are available for screens, APIs, data, authorization, Gantt, Kanban cache handling, audit logs, tests, requirements traceability, code reading, and the learning map.

## Current boundary

Phase 9 adds saved Playwright E2E, a manual-only quality workflow, Assignee management UI, hydration-safe authentication restoration, and final learning/traceability documents. Local verification is complete; Phase 9 remains unstaged and uncommitted pending review. It adds no new large business feature, automatic CI trigger, deployment, or external paid service.
