# Code Reading Guide

PLAN_VERSION: `CONSTRUCTION-V1.0`

## Recommended order

1. Start at `frontend/src/app/layout.tsx` and `frontend/src/providers/app-providers.tsx` to see `AppShell`, TanStack Query, and `AuthProvider` composition.
2. Follow one screen such as `frontend/src/app/projects/page.tsx` into `businessApi.projects` and `businessKeys.projects.list`.
3. Cross the rewrite in `frontend/next.config.ts` to `backend/app/api/router.py` and `backend/app/api/routes/business.py`.
4. Continue through `backend/app/services/business.py`, the SQLAlchemy models, and Alembic revisions.
5. Read the nearest Vitest or pytest file, then finish with `frontend/e2e/critical-flows.spec.ts`.

## One complete browser-to-database round trip

`ProjectsPageContent` reads URL state, builds `businessKeys.projects.list(current)`, and calls `businessApi.projects`. `apiRequest` sends `/api/v1/projects?...` to Next.js. The rewrite in `next.config.ts` forwards it to FastAPI. `project_list` validates `ProjectListQuery`, calls `list_projects`, and executes SQLAlchemy against PostgreSQL. Pydantic serializes the ORM result to JSON. TanStack Query stores it and React renders the cards.

## Authentication round trip

`LoginForm` calls `AuthProvider.login`. `/auth/login` verifies Argon2id credentials and returns a raw opaque token while PostgreSQL stores only its SHA-256 hash. `storeToken` keeps the learning token in localStorage. Later `apiRequest` adds `Authorization: Bearer ...`. `get_current_user` hashes and resolves the persisted active session. `AuthProvider` deliberately starts as `loading` on server and client, then restores after mount so protected content cannot flash and hydration remains identical.

## Project search

`projectSearchFromUrl` normalizes browser query parameters. `projectSearchToUrl` preserves restorable state. Every result-changing value is in `businessKeys.projects.list`. FastAPI maps only approved sort names, applies case-insensitive name matching, assignee joins, inclusive period overlap, stable ID tie-breaking, and pagination in `list_projects`; arbitrary query text is never passed as an ORM column.

## Versioned status change and audit

The frontend submits `expected_version`. `transition_project` loads with `_locked_project` (`SELECT ... FOR UPDATE`), calls `_check_version`, enforces the role-specific transition matrix, increments version, and calls `_audit`. Status and AuditLog commit in one SQLAlchemy transaction. A stale request returns structured 409 without overwriting the winner.

## Kanban optimistic update

`useStatusTransition` runs `cancelStatusQueries`, then `snapshotStatusCaches`. `applyProjectStatusToCaches` shape-checks Kanban arrays, Project list envelopes, detail, and Gantt entries before the immediate move. Success applies the server status/version. Errors call `restoreStatusCaches`; 401 clears authentication only after rollback. `reconcileStatusQueries` invalidates Kanban, all Project queries, Gantt, and history in `onSettled`.

## Gantt calculation

`visibleRange`, `rangesIntersect`, `clipRange`, `inclusiveDays`, `dayOffset`, and `barGeometry` in `frontend/src/gantt/date-geometry.ts` operate only on date strings and numbers. `/schedule` chooses a fixed day width and passes pure geometry into React styles. Viewport width changes scrolling, not date math. FastAPI and PostgreSQL never store pixels.

## What each test layer makes real

- Vitest/RTL: real React components, hooks, query cache, forms, and pure functions in jsdom; network calls and router/auth boundaries are mocked where the unit needs control.
- pytest: real FastAPI application, service code, SQLAlchemy, Alembic schema, transactions, locks, and PostgreSQL 16 test DB; HTTP is usually in-process TestClient rather than TCP.
- Playwright: real Chromium, Next.js server/rewrite, FastAPI, SQLAlchemy, and PostgreSQL test DB over real HTTP. Only forced failure uses request interception; stale 409 uses a real competing server update.

## Familiar mappings from TEA/EC and common frameworks

| Construction implementation | Familiar analogue |
|---|---|
| `apiRequest` / `businessApi` | Axios/fetch client in EC or TEA |
| FastAPI `APIRouter` | Django URL routing |
| SQLAlchemy `select` | Django ORM QuerySet |
| FastAPI dependency | DRF permission class |
| Pydantic request schema | serializer validation |
| SQLAlchemy transaction | `transaction.atomic` |
| `with_for_update()` | `select_for_update` |
| React Context/Provider | shared authenticated application context |
| Vitest/RTL | Jest/RTL |
| pytest TestClient | backend API integration test |
| Playwright | full browser E2E |

TEA shares master/detail data, validation, roles, lifecycle flags, and audit-style traceability. EC shares list/search/filter/pagination, authenticated API clients, recoverable forms, cache invalidation, and browser flows. Construction differs most in multiple assignees, date geometry, status transition locks, and optimistic Kanban rollback.
