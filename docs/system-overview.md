# System Overview

PLAN_VERSION: `CONSTRUCTION-V1.0`

## Purpose

CONSTRUCTION-V1 is a learning-oriented SaaS for construction and equipment-work companies to manage projects, customers, properties, assignees, schedules, progress, and project change history in one system.

## Responsibility map

```text
Browser / Next.js App Router
  - routes and screens
  - React Hook Form input state
  - TanStack Query server-state cache
  - Gantt pure calculations and rendering
  - Kanban optimistic feedback and rollback
          |
          | JSON REST + opaque Bearer token
          v
FastAPI
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
PostgreSQL 16
  - business data, token sessions, constraints, versions, audit logs
```

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
