# Construction Project SaaS

Project ID: `CONSTRUCTION-V1`

Plan version: `CONSTRUCTION-V1.0`

Implementation status: not started

This repository is a learning implementation of a construction-industry project management SaaS. It is intended to make the work history described in the career material traceable from the browser through the API and ORM to PostgreSQL.

## Planned scope

- Project, customer, property, and assignee management
- Search, filtering, sorting, and pagination
- Multiple assignees per project
- Role- and project-status-based authorization
- Project-level monthly and weekly Gantt views
- Kanban status changes with optimistic update and rollback
- Audit history for project fields, status, dates, and assignments

## Planned technology

- Frontend: Node.js 22, Next.js App Router, React, TypeScript, TanStack Query, React Hook Form
- Backend: Python 3.12, FastAPI, SQLAlchemy, Alembic
- Database: PostgreSQL 16
- Tests: Vitest, React Testing Library, Playwright, pytest
- Environment: Docker Compose, npm
- Planned CI after separate approval: GitHub Actions

Python runtime dependencies and development/test dependencies will be managed separately. Exact package versions and dependency files will be fixed when implementation is approved.

## Documentation

Start with:

- `docs/implementation-plan.md`
- `docs/requirements.md`
- `docs/system-overview.md`
- `docs/status.md`
- `docs/decision-log.md`

Detailed plans are available for screens, APIs, data, authorization, Gantt, Kanban cache handling, audit logs, and tests.

## Current restriction

Only planning documents exist. No application scaffold, dependencies, Docker services, migrations, CI workflow, or implementation has been created yet.
