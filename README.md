# Construction Project SaaS

Project ID: `CONSTRUCTION-V1`

Plan version: `CONSTRUCTION-V1.0`

Implementation status: Phase 3 authentication and authorization foundation implemented and verified

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
- Planned CI after separate approval: GitHub Actions

The project uses Node.js `22.23.2`, npm `10.9.8`, Python `3.12.13`, and PostgreSQL `16.14`. Frontend direct dependencies are fixed in `frontend/package.json`, the complete npm graph is fixed in `frontend/package-lock.json`, and backend packages are fixed in separate runtime and development/test requirement files.

## Frontend commands

Prerequisites: Node.js `22.23.2` and npm `10.9.8`.

```bash
cd frontend
npm ci
npm run dev
npm test
npm run lint
npm run format
npm run format:check
npm run typecheck
npm run build
```

The development server uses `http://localhost:3000` by default. Phase 1 verification ran every command above successfully. The automated tests use jsdom and React Testing Library; they do not use a real browser.

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

Alembic shares backend settings. Phase 3 adds the authentication-foundation revision:

```bash
docker compose exec -T backend alembic upgrade head
docker compose exec -T backend alembic current
docker compose exec -T backend alembic check
docker compose exec -T backend python -m app.db.seed
```

The seed command is idempotent and uses the learning-only passwords from `.env`. Demo login IDs are `admin@example.com`, `manager@example.com`, `member@example.com`, and inactive `inactive@example.com`; their example passwords are documented only in `.env.example`. The login UI is at `http://localhost:3000/login`, and `/account` demonstrates protected-route, role-gate, and logout behavior.

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
  src/lib/api/              API client and shared error types
  src/providers/            TanStack Query provider
backend/
  app/api/                  v1 router, health route, shared errors
  app/core/                 settings
  app/db/                   lazy SQLAlchemy engine/session and test DB guard
  app/auth/                 password/token service and authorization dependencies
  app/models/               User, AuthTokenSession, and Assignee
  alembic/                  Phase 3 authentication schema revision
  tests/                    health, errors, DB safety, authentication, roles, seed
```

## Documentation

Start with:

- `docs/implementation-plan.md`
- `docs/requirements.md`
- `docs/system-overview.md`
- `docs/status.md`
- `docs/decision-log.md`

Detailed plans are available for screens, APIs, data, authorization, Gantt, Kanban cache handling, audit logs, and tests.

## Current boundary

Phase 3 contains authentication and authorization foundations only. It has no Customer, Property, Project, project assignment, business API, audit history, status service, Gantt, Kanban, GitHub Actions workflow, or production deployment.
