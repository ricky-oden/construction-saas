# CONSTRUCTION-V1 Implementation Plan

PLAN_VERSION: `CONSTRUCTION-V1.0`

Parent plan: `CAREER-SYSTEMS-V1`

## Objective

Build a learning-oriented construction project management SaaS that connects UI state, REST APIs, authorization and domain services, SQLAlchemy, PostgreSQL, tests, and Docker Compose in a traceable way. The plan preserves the career material's central concerns: search-condition management, date-range calculation, optimistic updates with rollback, multiple assignees, permission/status controls, and change history.

## Approved technology baseline

- Node.js 22.x and npm
- Next.js App Router, React, TypeScript
- TanStack Query and React Hook Form
- Python 3.12.x
- FastAPI, SQLAlchemy, Alembic
- PostgreSQL 16.x
- Vitest, React Testing Library, Playwright, pytest
- Docker Compose
- GitHub Actions after separate implementation approval; initially `workflow_dispatch` only
- Separate Python runtime and development/test dependencies

## Approved delivery phases

| Phase | Scope | Requirement groups | Status |
|---|---|---|---|
| 0 | Approve and freeze planning documents | All | Completed |
| 1 | Scaffold frontend/backend and local quality commands | ENV, UI | Completed |
| 2 | Docker Compose, PostgreSQL, Alembic, and DB-facing error integration | ENV, API, DATA | Completed |
| 3 | Learning login, opaque token, users/assignees, authorization base | AUTH | Completed |
| 4 | Customer, property, project list/detail/create/update vertical slice | DATA, PRJ | Completed |
| 5 | Search, filtering, sorting, pagination, cache policy | SEARCH, CACHE | Completed |
| 6 | Multiple assignees, status service, optimistic locking, audit history | STATUS, AUDIT | Implemented and verified; review pending |
| 7 | Project-level monthly/weekly Gantt | GANTT | Not implemented |
| 8 | Kanban optimistic update, rollback, and conflict handling | KANBAN, CACHE | Not implemented |
| 9 | Cross-layer tests, separately approved manual CI, documentation synchronization, learning map | TEST, ENV | Not implemented |

## Dependency order

```text
environment and data constraints
        -> authentication and backend authorization
        -> project/customer/property/assignee APIs
        -> search, cache, assignment, status, audit
        -> Gantt and Kanban
        -> cross-layer verification
```

Gantt and Kanban must not be implemented before the project model, backend authorization, API error contract, and relevant services exist.

## Implementation rules

- The backend is authoritative for authentication, authorization, customer/property consistency, status transitions, and integer-version conflict detection.
- Frontend permission controls improve UX but never replace backend authorization.
- Major business data is archived or marked inactive rather than physically deleted.
- Business changes and their audit records are saved in the same database transaction.
- Query keys include all server-state selection parameters. Mutations update or invalidate every affected cache.
- Pixel positioning for Gantt bars is a frontend pure-function concern; persisted data remains date-based.

## Phase completion gate

A phase is complete only when its mapped acceptance criteria pass, planned automated tests pass, documentation reflects the implementation, and verification results are recorded in `docs/status.md`. Unexecuted verification cannot be reported as passing.

## Explicitly out of scope

- Multiple tenants
- Billing and contract management
- File attachments
- Notifications and email
- Holiday calendars
- Process/task-level Gantt charts
- Production deployment
- Paid or external services

## Unresolved before relevant implementation

- Remaining post-Phase-4 domain field catalogs and validation limits
- Archive reactivation rules and referential behavior
- Gantt visible-range defaults and week-start convention
- Audit retention and whether reasons are mandatory for selected actions
- Whether the career material's broader "process/progress" wording requires data beyond project status and project date range; process/task-level Gantt remains out of scope
