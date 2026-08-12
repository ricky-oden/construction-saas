# System Overview

PLAN_VERSION: `CONSTRUCTION-V1.0`

## Purpose

CONSTRUCTION-V1 is a learning-oriented SaaS for construction and equipment-work companies to manage projects, customers, properties, assignees, schedules, progress, and project change history in one system.

## Responsibility map

```text
Browser -> localhost:3000 / Next.js App Router
  - routes and screens
  - React Hook Form input state
  - TanStack Query server-state cache
  - Gantt pure calculations and rendering
  - Kanban optimistic feedback and rollback
          |
          | same-origin /api/v1 rewrite
          v
FastAPI (Compose backend:8000; host localhost:8002)
  - request/response validation
  - authentication and final authorization
  - customer/property consistency
  - project status transition service
  - integer-version conflict detection
  - transaction and audit coordination
          |
          v
SQLAlchemy / Alembic
  - ORM persistence and schema migration
          |
          v
PostgreSQL 16.14 (Compose db:5432; no host port)
  - business data, token sessions, constraints, versions, audit logs
```

Phase 2 provides this path only through DB-backed health; authentication and all business routes shown as responsibilities remain later-phase work.

## Local container topology

- `frontend`: Node.js 22.23.2, source mount plus named `node_modules` volume, nonroot `node` user.
- `backend`: Python 3.12.13 development target, source mount, nonroot UID 10001.
- `db`: persistent `construction_saas` development database in a named volume.
- `test-db`: profile-only `construction_saas_test` database in tmpfs.

The backend lazily creates its SQLAlchemy engine/session factory from `DATABASE_URL` with pool pre-ping. Alembic reads the same settings. Importing the FastAPI application does not itself open a database connection. The health dependency executes `SELECT 1`; SQLAlchemy failures use the common safe 503 error envelope.

## Initial vertical slice

In accordance with `CAREER-SYSTEMS-V1`, the first business slice is:

```text
project list
-> search/filter/sort/pagination
-> FastAPI list endpoint
-> SQLAlchemy
-> PostgreSQL
-> project detail
```

Authentication, backend authorization, common API errors, and core data constraints must exist before this slice is considered complete. Gantt and Kanban follow after the base project APIs.

## Security boundary

The opaque token is stored by the frontend in localStorage for learning simplicity. This makes the token readable by JavaScript; any XSS can steal it. The implementation must avoid unsafe HTML injection, document the risk, and must not describe localStorage as a production-grade secure session design. The backend remains authoritative and validates the persisted token for every protected request.

## Cross-project learning map

The common concepts shared with TEA-V1 and EC-V1 are list operations, forms, REST validation, backend authorization, ORM persistence, error handling, and layered tests. Construction-specific emphasis is date visualization, multiple assignees, optimistic Kanban updates with rollback, version conflicts, and project audit history.

## Scope boundary

See `docs/requirements.md` for accepted requirements and explicit out-of-scope items. The system is single-tenant and local-development focused; it contains no billing, attachments, notifications, holiday engine, process-level Gantt, production deployment, or paid/external integration.
