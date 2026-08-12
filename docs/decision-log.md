# Decision Log

PLAN_VERSION: `CONSTRUCTION-V1.0`

This log records the initial approved baseline and future approved changes. Initial decisions establish the project plan and are not `PROPOSED_CHANGE` entries.

## 2026-08-10 — Initial baseline

| ID | Decision |
|---|---|
| DEC-001 | Establish the project plan as `CONSTRUCTION-V1.0` under `CAREER-SYSTEMS-V1`. |
| DEC-002 | Use Node.js 22.x, npm, Next.js App Router, React, TypeScript, TanStack Query, and React Hook Form. |
| DEC-003 | Use Python 3.12.x, FastAPI, SQLAlchemy, Alembic, and separately managed runtime versus development/test dependencies. |
| DEC-004 | Use PostgreSQL 16.x and Docker Compose. |
| DEC-005 | Use Vitest, React Testing Library, Playwright, and pytest. |
| DEC-006 | Implement a learning login API with a backend-issued opaque Bearer token stored in the database; keep the frontend token in localStorage and document its XSS exposure. |
| DEC-007 | Use `ADMIN`, `MANAGER`, and `MEMBER`; enforce final authorization in the backend. |
| DEC-008 | Model one customer to many properties, one property to many projects, one project to exactly one customer and property, and projects to assignees as many-to-many. A project cannot span multiple properties. |
| DEC-009 | Link assignees to login users and validate customer/property consistency in the backend. |
| DEC-010 | Use project statuses `DRAFT`, `PLANNED`, `IN_PROGRESS`, `ON_HOLD`, `COMPLETED`, and `CANCELLED`; validate transitions in a dedicated backend service. |
| DEC-011 | Limit the initial Gantt to project-level date bars with month/week views, including weekends but not holiday logic. Pixel calculations belong to frontend pure functions. |
| DEC-012 | Use TanStack Query optimistic Kanban updates: snapshot in `onMutate`, restore on failure, and refetch in `onSettled`. |
| DEC-013 | Revalidate authorization, transitions, and integer `version` in the backend; return HTTP 409 for version conflicts. |
| DEC-014 | Audit initial project fields, status, date range, and assignee assignment changes. Detailed customer/property field history is out of scope. |
| DEC-015 | Archive or deactivate major business data instead of physically deleting it. |
| DEC-016 | Exclude multi-tenancy, billing/contracts, attachments, notifications/email, holiday calendars, process-level Gantt, production deployment, and paid/external services. |
| DEC-017 | Retain GitHub Actions as a future parent-plan technology, but create no workflow until separately approved; the initial workflow is manual `workflow_dispatch` only. |
| DEC-018 | Preserve the career material's shared UI/form behavior and unified API error handling as explicit requirements. |

## 2026-08-12 — Phase 1 implementation details

| ID | Decision |
|---|---|
| DEC-019 | Pin Node.js 22.23.2 and npm 10.9.8. This Node patch satisfies Next.js 16.3.0, Vitest 4.1.10, Vite transitive requirements, and jsdom 29.1.1 while retaining the approved Node 22 family. |
| DEC-020 | Pin frontend runtime packages to Next.js 16.3.0, React/React DOM 19.2.8, TanStack Query 5.101.4, and React Hook Form 7.85.0. These were current mutually compatible patches confirmed from npm metadata on 2026-08-12. |
| DEC-021 | Pin frontend development packages in `package.json` and the full dependency graph in `package-lock.json`; use ESLint 9.39.5 with eslint-config-next 16.3.0, Prettier 3.9.6, TypeScript 5.9.3, Vitest 4.1.10, React Testing Library 16.3.2, and jsdom 29.1.1. |
| DEC-022 | Pin Python 3.12.13 and the backend requirement files. Runtime contains FastAPI 0.141.1, Pydantic 2.13.4, pydantic-settings 2.15.0, SQLAlchemy 2.0.52, Alembic 1.19.1, and Uvicorn 0.52.1; development/test adds pytest 9.1.1, Ruff 0.16.2, and the TestClient HTTP stack. This matches the compatible FastAPI/Python 3.12 set already verified in TEA-V1. |
| DEC-023 | Keep pytest, Ruff, and HTTP test tooling out of `requirements.txt`; `requirements-dev.txt` includes runtime requirements and adds development/test-only packages. |
| DEC-024 | Fix the Phase 1 common API error envelope as `error.code`, `error.message`, `error.field_errors`, and optional `error.conflict`. Exact 409 conflict metadata remains unresolved for its later phase. |

## 2026-08-12 — Phase 2 implementation details

| ID | Decision |
|---|---|
| DEC-025 | Use Compose project `construction-project-saas`, frontend host port 3000, backend host port 8002, and PostgreSQL 16.14 without a host-published database port. |
| DEC-026 | Persist `construction_saas` in a named volume and isolate profile-only `construction_saas_test` in tmpfs. Tests require an explicit PostgreSQL URL whose database ends in `_test`; failure never falls back to development. |
| DEC-027 | Add psycopg 3.3.4 runtime packages for SQLAlchemy PostgreSQL connectivity while retaining pytest, Ruff, and the test HTTP client only in development/test dependencies. |
| DEC-028 | Lazily create the SQLAlchemy engine/session factory with pool pre-ping. Settings, engine, and session caches have explicit test resets; application import does not connect to PostgreSQL. |
| DEC-029 | Configure Alembic to use the same backend settings and empty metadata. Create no baseline revision because Phase 2 defines no model or schema, while `upgrade head`, `current`, and `check` remain executable. |
| DEC-030 | Route browser API traffic through Next.js at same-origin `/api/v1`; use `BACKEND_INTERNAL_URL=http://backend:8000` only within Compose and allow `http://localhost:8002` for non-Docker backend development. |
| DEC-031 | Use Node.js 22.23.2 and Python 3.12.13 multi-stage Dockerfiles. Frontend and backend development/production targets run nonroot; backend production inherits runtime dependencies only. |

## 2026-08-12 — Phase 3 implementation details

| ID | Decision |
|---|---|
| DEC-032 | Use normalized unique email login IDs and Argon2id password hashes via argon2-cffi 25.1.0. Pin its bindings and CFFI runtime dependencies. |
| DEC-033 | Generate opaque tokens with `secrets.token_urlsafe(32)`, return the raw value once, persist only its SHA-256 hash, and expire sessions after eight hours. |
| DEC-034 | Use a partial unique index to allow at most one unrevoked AuthTokenSession per user. Re-login revokes the prior row and creates a new hashed session; logout sets `revoked_at`; inactive users cannot log in or authenticate. |
| DEC-035 | Implement User roles `ADMIN`, `MANAGER`, and `MEMBER`, backend active-token and role dependencies, and stable `AUTHENTICATION_REQUIRED` 401 versus `FORBIDDEN` 403 errors. Resource/assignment authorization remains later-phase. |
| DEC-036 | Model User to Assignee as optional one-to-one. Create no Project assignment or other business model in Phase 3. |
| DEC-037 | Store the learning token in frontend localStorage, attach it as a Bearer credential, clear it on 401, restore via `/auth/me`, preserve the protected-route path, and document XSS exposure. |
| DEC-038 | Provide an environment-driven, idempotent four-user demo seed with ADMIN, MANAGER, MEMBER, inactive, and assignee-linked cases. Values in `.env.example` are learning-only. |

## Change control

After this baseline, a request that changes `CAREER-SYSTEMS-V1` or the approved `CONSTRUCTION-V1` plan must be recorded as `PROPOSED_CHANGE`, approved explicitly, and only then reflected here with a new plan version.
