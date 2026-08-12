# Test Strategy

PLAN_VERSION: `CONSTRUCTION-V1.0`

Requirement: TEST-001

Status: `PARTIAL` — Phase 1/2 foundation coverage implemented; later business and browser coverage remains.

## Principles

- Test business rules at the lowest layer that owns them.
- Use PostgreSQL 16 for behavior where database constraints, transactions, JSON, or locking matter.
- Keep a small set of critical Playwright flows rather than duplicating every backend case in a browser.
- State explicitly what is mocked and what is real.
- A requirement remains incomplete if its planned verification is failing or not run.

## Frontend: Vitest and React Testing Library

Phase 1 verified in jsdom:

- Top page
- Loading, error, and empty states
- Disabled and explicitly loading button states
- React Hook Form input retention and required validation
- 404 component and return link

These are component tests; they do not launch a real browser or exercise a live backend.

Later phases add:

- Gantt date-range intersection, clipping, and pixel geometry pure functions
- Search parameter normalization and query-key construction
- Form validation and retained input on API error
- Role/status/assignment-based visibility and disabled state
- Loading, empty, validation, authorization, conflict, and server-error display
- Kanban `onMutate` snapshot, optimistic cache update, rollback, and invalidation behavior

## Backend: pytest

Phase 2 verifies with in-process FastAPI TestClient and real PostgreSQL:

- DB-backed health success
- Unified validation and 404 errors
- Unified unexpected 500 error
- Internal exception text is absent from the response

The suite uses a real profile-only PostgreSQL test DB for `get_db` and health. TestClient itself is in-process rather than a real TCP client. Compose healthchecks and the Next.js same-origin health request separately exercise real container TCP.

Phase 2 additionally verifies:

- required, valid PostgreSQL test URL with an explicit host and port
- rejection of missing, malformed, non-PostgreSQL, and non-`_test` URLs
- `Depends(get_db)` host, port, database, and user identity
- stopped test DB failure without development DB fallback
- safe DB error envelope without credentials, connection URL, or internal exception text

Later phases add:

- Login, active/revoked/invalid opaque token behavior
- ADMIN/MANAGER/MEMBER authorization and assigned-project scope
- Customer/property/project cardinality and consistency
- Customer, property, assignee, and project CRUD/archive behavior
- Project search combinations, sorting, and pagination
- Multiple assignee uniqueness and replacement
- Status transition service against the approved matrix
- Integer-version increment and HTTP 409 conflict
- Audit contents and mutation/audit atomicity
- Business endpoint use of the Phase 1 common API error contract

## PostgreSQL integration

Use the Compose-profile `construction_saas_test` PostgreSQL database in tmpfs to verify:

- Foreign keys and uniqueness
- Transactions and rollback
- Version-conflict behavior
- Audit persistence
- Date filtering and ordering
- Archive/default-scope queries

SQLite-only verification is insufficient for these cases.

## Playwright critical flows

1. Login, project list search, project detail.
2. ADMIN or MANAGER registers and updates a project with customer/property validation.
3. Combined project filters, sorting, and pagination.
4. Month/week Gantt switch and visible-range navigation.
5. Successful Kanban transition.
6. Forced API failure restores the Kanban display.
7. Forced version conflict shows 409 handling and reconciles server state.
8. MEMBER can see an assigned project but not an unassigned project or prohibited controls.
9. Multiple assignee change appears in project history.

## Traceability matrix

| Requirement | Primary verification |
|---|---|
| ENV-001–003 | Version/config inspection, reproducible commands, and manual-trigger workflow inspection after separate approval |
| UI-001, API-001 | Vitest/RTL shared behavior plus pytest error-contract cases |
| AUTH-001–003 | pytest API/service plus selected Playwright role flow |
| DATA-001–003 | pytest with PostgreSQL constraints/service validation |
| PRJ-001–004 | pytest API plus core Playwright flow |
| SEARCH-001 | pytest query cases, Vitest query keys, Playwright combined controls |
| ARCH-001 | pytest API/database and list visibility |
| STATUS-001–002 | pytest service/conflict and Playwright conflict path |
| GANTT-001–002 | Vitest pure functions and Playwright display switching |
| KANBAN-001–002 | Vitest cache behavior, pytest transition, Playwright success/failure |
| CACHE-001 | Vitest query/mutation cache tests and Playwright stale-data checks |
| AUDIT-001 | pytest transaction/history and Playwright assignment history |

## CI boundary

GitHub Actions is not part of Phase 2 and no workflow exists. When separately approved in Phase 9, initial CI must follow the parent blueprint's `workflow_dispatch`-only rule until automatic triggers are explicitly approved.

## Unresolved test setup

- Fixture/seed identities and credentials
- Browser matrix
- Coverage thresholds

Phase 2 migration checks are `alembic upgrade head`, `alembic current`, and `alembic check`. No revision exists until a later phase introduces schema metadata.
