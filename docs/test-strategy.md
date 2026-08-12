# Test Strategy

PLAN_VERSION: `CONSTRUCTION-V1.0`

Requirement: TEST-001

Status: `VERIFIED` — layered jsdom, PostgreSQL, saved Chromium E2E, and reproducible local verification completed.

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

Phase 7 jsdom tests cover month/week/year/leap boundaries, Monday weeks, inclusive one-day width, intersection, both-side clipping, fixed geometry, URL restoration, mode/navigation controls, loading/error/empty, status, and detail links. The component API is mocked; pure functions do not use React or the DOM.

Phase 8/9 add:

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

Phase 8 adds Kanban endpoint/cache integration; Phase 9 adds the saved repository Playwright suite.

## PostgreSQL integration

Use the Compose-profile `construction_saas_test` PostgreSQL database in tmpfs to verify:

- Foreign keys and uniqueness
- Transactions and rollback
- Version-conflict behavior
- Audit persistence
- Date filtering and ordering
- Archive/default-scope queries

SQLite-only verification is insufficient for these cases.

## Playwright critical-flow mapping

| Saved test in `frontend/e2e/critical-flows.spec.ts` | Directly verified flow |
|---|---|
| `login, project search/detail, logout, and hydration stay consistent` | Login, Project list search, Project detail, logout, protected-route redirect, and absence of hydration console errors |
| `MANAGER registers and updates customer, property, and project through UI` | Customer create/update, Property create, Project create/update through real forms and APIs |
| `combined filters, stable sorting, pagination, and URL restoration` | Combined name/date filtering, fixed sort/order, pagination, reload, and URL restoration |
| `Gantt switches month/week, moves period, and links to detail` | Month/week switch, week range, next/previous period, and Project-detail navigation |
| `Kanban success is optimistic and settles to the server version` | Pre-response optimistic move, successful transition, and authoritative version replacement |
| `Kanban rolls optimistic state back on API failure` | Test-side intercepted 500, immediate move, complete rollback, error display, and original version restoration |
| `stale Kanban version shows 409 and restores the server winner` | Real competing ADMIN update, stale 409, rollback/refetch, winner status, and winner version |
| `MEMBER scope, API denial, and multiple-assignee history are enforced` | Multiple assignment and history, assigned-only MEMBER UI/API scope, unassigned 403, management 403, and prohibited transition/control |

These eight tests cover all required browser flows; one test may cover multiple acceptance paths. Request interception is used only for the forced 500. The 409 winner and every normal operation use the real backend and test database.

Screenshots are kept only on failure. Trace and video are disabled because browser network traces can retain Authorization headers. Playwright reports, screenshots, and test-result directories are Git-ignored; failures must not print credential values or response tokens.

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

The approved Phase 9 workflow exists at `.github/workflows/manual-quality.yml`. It has only `workflow_dispatch`, calls `scripts/verify-phase9.sh`, and was checked statically. It has not been run on GitHub; automatic triggers remain prohibited.

## Unresolved test setup

- Browser matrix
- Coverage thresholds

Phase 4 migration checks include downgrade to the Phase 3 revision followed by `alembic upgrade head`, `alembic current`, and `alembic check` against the isolated test database.

Phase 6 verification runs 107 pytest cases against PostgreSQL 16.14 and 46 frontend tests in jsdom. The isolated database migration was downgraded to `20260812_02`, upgraded to `20260812_03`, and passed `current` and `check`. The real-TCP same-origin smoke covers ADMIN assignment, assigned MEMBER list/detail, an approved transition, and history.

Phase 7 verification runs 110 pytest cases against PostgreSQL 16.14 and 65 frontend tests in jsdom. Backend additions directly verify period overlap with MEMBER assignment scope and stable ADMIN/MANAGER ordering; frontend API coverage verifies all-page retrieval. An interactive real-browser smoke verified demo ADMIN login, initial Asia/Tokyo month Gantt, status/bar rendering, and navigation from the bar to Project detail; this was not a checked-in Playwright test suite.

Phase 8 verification runs 112 pytest cases against PostgreSQL 16.14 and 82 frontend tests in jsdom. Deferred frontend requests directly verify pre-response card movement, double-operation prevention, authoritative version replacement, complete rollback for 401/403/409/422/network/5xx, rollback-before-401-auth-clear ordering, server-winner refetch, safe multi-cache updates, and settled invalidation of Project, Gantt, and history queries. Backend additions verify concurrent status transitions produce one winner/one 409 and forced AuditLog failure rolls back status and version. An interactive real-browser smoke verified MANAGER login, `/kanban`, `IN_PROGRESS → ON_HOLD`, version/history reflection, Project-detail navigation, and MEMBER assigned-only controls. Forced browser failure/409 was not injected; those paths are covered in Vitest and PostgreSQL pytest. No checked-in Playwright suite exists yet.

Phase 9 verification runs 112 pytest cases against PostgreSQL 16.14, 86 Vitest/RTL tests in jsdom, and 8 saved Playwright Chromium tests against production Next.js, FastAPI, and the isolated PostgreSQL test DB. The complete local script additionally checks Alembic clean upgrade/current/check/downgrade/re-upgrade, lint/format/typecheck/build, seed idempotency, same-origin health, nonroot containers, and production dependency separation. No test is skipped or xfailed. The GitHub Actions remote run remains intentionally unexecuted.
