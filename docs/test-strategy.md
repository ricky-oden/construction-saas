# Test Strategy

PLAN_VERSION: `CONSTRUCTION-V1.0`

Requirement: TEST-001

Status: `NOT_IMPLEMENTED`

## Principles

- Test business rules at the lowest layer that owns them.
- Use PostgreSQL 16 for behavior where database constraints, transactions, JSON, or locking matter.
- Keep a small set of critical Playwright flows rather than duplicating every backend case in a browser.
- State explicitly what is mocked and what is real.
- A requirement remains incomplete if its planned verification is failing or not run.

## Frontend: Vitest and React Testing Library

- Gantt date-range intersection, clipping, and pixel geometry pure functions
- Search parameter normalization and query-key construction
- Form validation and retained input on API error
- Role/status/assignment-based visibility and disabled state
- Loading, empty, validation, authorization, conflict, and server-error display
- Kanban `onMutate` snapshot, optimistic cache update, rollback, and invalidation behavior

## Backend: pytest

- Login, active/revoked/invalid opaque token behavior
- ADMIN/MANAGER/MEMBER authorization and assigned-project scope
- Customer/property/project cardinality and consistency
- Customer, property, assignee, and project CRUD/archive behavior
- Project search combinations, sorting, and pagination
- Multiple assignee uniqueness and replacement
- Status transition service against the approved matrix
- Integer-version increment and HTTP 409 conflict
- Audit contents and mutation/audit atomicity
- Unified API error contract

## PostgreSQL integration

Use a disposable test PostgreSQL database to verify:

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

GitHub Actions is not part of the current documentation-only work. When separately approved, initial CI must follow the parent blueprint's `workflow_dispatch`-only rule until automatic triggers are explicitly approved.

## Unresolved test setup

- Test database lifecycle command
- Fixture/seed identities and credentials
- Browser matrix
- Coverage thresholds
- Exact formatter, lint, type-check, and migration-check commands
