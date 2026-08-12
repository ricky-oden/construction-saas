# Construction Project SaaS

Project ID: `CONSTRUCTION-V1`

Plan version: `CONSTRUCTION-V1.0`

Implementation status: Phase 1 scaffold implemented and verified

This repository is a learning implementation of a construction-industry project management SaaS. It is intended to make the work history described in the career material traceable from the browser through the API and ORM to PostgreSQL.

## Planned scope

- Project, customer, property, and assignee management
- Search, filtering, sorting, and pagination
- Multiple assignees per project
- Role- and project-status-based authorization
- Project-level monthly and weekly Gantt views
- Kanban status changes with optimistic update and rollback
- Audit history for project fields, status, dates, and assignments

## Technology and fixed Phase 1 runtime

- Frontend: Node.js 22, Next.js App Router, React, TypeScript, TanStack Query, React Hook Form
- Backend: Python 3.12, FastAPI, SQLAlchemy, Alembic
- Database: PostgreSQL 16
- Tests: Vitest, React Testing Library, Playwright, pytest
- Environment: Docker Compose, npm
- Planned CI after separate approval: GitHub Actions

Phase 1 uses Node.js `22.23.2`, npm `10.9.8`, and Python `3.12.13`. Frontend direct dependencies are fixed in `frontend/package.json`, the complete npm graph is fixed in `frontend/package-lock.json`, and backend packages are fixed in separate runtime and development/test requirement files.

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

The health endpoint is `GET http://127.0.0.1:8002/api/v1/health`. Phase 1 verification ran these commands successfully. pytest uses FastAPI TestClient in-process and no database; a separate development-server smoke check verified the health endpoint over real local TCP.

## Phase 1 structure

```text
frontend/
  src/app/                  Next.js App Router layout, top page, 404, global CSS
  src/components/           app shell, common states/button, minimal form
  src/lib/api/              API client and shared error types
  src/providers/            TanStack Query provider
backend/
  app/api/                  v1 router, health route, shared errors
  app/core/                 settings
  app/db/                   Phase 2 database boundary only
  alembic/                  Phase 2 placeholder only; no revision
  tests/                    health and common-error tests
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

Phase 1 contains foundation code only. It has no PostgreSQL connection or schema, migration revision, Docker/Compose file, GitHub Actions workflow, authentication/authorization, business model, business API, Gantt, or Kanban implementation.
