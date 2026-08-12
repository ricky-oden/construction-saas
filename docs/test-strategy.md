# Test Strategy

PLAN_VERSION: `CONSTRUCTION-V1.0`

Requirement: TEST-001

Status: `PARTIAL` — Phase 1–6 foundation, business workflows, PostgreSQL concurrency, and jsdom coverage implemented; real-browser and later Gantt/Kanban coverage remains.

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

Phase 3 jsdom tests add token storage/restoration, Bearer attachment, 401 clearing, protected-route origin retention, role-gated display, login input retention, pending disabled text, validation, successful token storage, and logout.

Phase 4 jsdom tests add Customer list loading/error/empty states, management-role gating, retained form input after API failure, pending disabled text, and project date-range validation. These tests mock API calls and do not launch a browser.

Phase 5 jsdom tests add URL restoration/normalization, submitted and immediate controls, reset and pagination navigation, all-condition query keys, stale-result suppression, loading/error/empty states, retained conditions on failure, cache invalidation, and bounded retry policy. API calls and Next.js navigation are mocked; no real browser is launched.

Phase 6 jsdom tests add assignment-aware Project controls, exact MEMBER visibility, required version payloads, pending disabled state, structured 409 display, and Project/history cache refetch. API calls remain mocked; no real browser is launched.

Later phases add:

- Gantt date-range intersection, clipping, and pixel geometry pure functions
- Search parameter normalization and query-key construction
- Form validation and retained input on API error
- Role/status/assignment-based visibility and disabled state
- Loading, empty, validation, authorization, conflict, and server-error display
- Kanban `onMutate` snapshot, optimistic cache update, rollback, and invalidation behavior

## Backend: pytest

Phase 2/3 verify with in-process FastAPI TestClient and real PostgreSQL:

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

Phase 3 additionally verifies:

- Argon2id password representation and login success/failure
- SHA-256-only token persistence and eight-hour expiration
- re-login invalidation, logout, invalid/revoked/expired tokens, and inactive users
- `/auth/me`, optional Assignee identity, and ADMIN/MANAGER/MEMBER dependencies
- unified 401/403 behavior
- migration upgrade/current/check and idempotent demo seed
- real Next.js proxy login→me→logout over container TCP

Phase 4 additionally verifies with real PostgreSQL:

- Customer, Property, and Project list/create/detail/update APIs
- customer/property mismatch and inactive-reference rejection
- preservation of unchanged inactive references on existing projects
- duplicate Customer/Project codes and reversed dates
- ADMIN/MANAGER access, MEMBER 403, and unauthenticated 401
- PostgreSQL unique, composite foreign-key, and date constraints
- migration downgrade/upgrade/current/check
- real Next.js proxy login and Customer→Property→Project flow over container TCP

Phase 5 backend tests cover individual and combined Project filters, case-insensitive name matching, status/customer/property selection, inclusive and one-sided period overlap, reversed periods, every fixed sort and both orders, stable ID ordering, pagination metadata/pages/limits, and 401/403. Customer and Property list pagination uses the same response contract.

Phase 6 backend tests cover multiple/duplicate/inactive assignees, retained historical assignment, Assignee management, assigned MEMBER scope, all allowed ADMIN/MANAGER transitions, MEMBER allowed and prohibited transitions, terminal states, required/stale versions, concurrent writes, version increments, structured audit values, forced audit rollback, archive, and assignee search.

Later phases add Gantt and Kanban endpoint integration plus real-browser workflows.

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

- Browser matrix
- Coverage thresholds

Phase 4 migration checks include downgrade to the Phase 3 revision followed by `alembic upgrade head`, `alembic current`, and `alembic check` against the isolated test database.

Phase 6 verification runs 107 pytest cases against PostgreSQL 16.14 and 46 frontend tests in jsdom. The isolated database migration was downgraded to `20260812_02`, upgraded to `20260812_03`, and passed `current` and `check`. The real-TCP same-origin smoke covers ADMIN assignment, assigned MEMBER list/detail, an approved transition, and history.
