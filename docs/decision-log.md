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

## Change control

After this baseline, a request that changes `CAREER-SYSTEMS-V1` or the approved `CONSTRUCTION-V1` plan must be recorded as `PROPOSED_CHANGE`, approved explicitly, and only then reflected here with a new plan version.
