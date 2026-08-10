# Requirements

PLAN_VERSION: `CONSTRUCTION-V1.0`

Status vocabulary: every requirement below is `NOT_IMPLEMENTED`.

## Environment and architecture

### ENV-001 — Fixed runtime and framework families

Use Node.js 22.x, Python 3.12.x, PostgreSQL 16.x, Next.js App Router, React, TypeScript, TanStack Query, React Hook Form, FastAPI, SQLAlchemy, Alembic, Vitest, React Testing Library, Playwright, pytest, Docker Compose, and npm.

Acceptance criteria:

- Runtime major versions are fixed in repository configuration.
- Dependency lockfiles are committed when implementation is authorized.
- The selected technologies can be identified from configuration and documented commands.

### ENV-002 — Dependency separation

Separate Python runtime dependencies from development/test dependencies.

Acceptance criteria:

- Production installation does not require development/test-only packages.
- Development/test installation reproducibly includes both sets.

### ENV-003 — Reproducible quality checks and manual CI

Document reproducible formatter, lint, test, build, and migration-check commands. After separate implementation approval, represent them in GitHub Actions with `workflow_dispatch` only until automatic triggers are explicitly approved.

Acceptance criteria:

- Local commands and CI commands run the same classes of checks.
- The initial workflow has no automatic push or pull-request trigger.
- No workflow file is created before explicit implementation approval.

## Shared frontend and API behavior

### UI-001 — Shared UI and form behavior

Share repeated buttons, inputs, error displays, search-condition handling, pagination behavior, and form processing where their semantics match.

Acceptance criteria:

- Repeated UI behavior has one documented reusable implementation path.
- React Hook Form owns editable form state and validation messages.
- API failures preserve recoverable user input.

### API-001 — Unified API errors

Use a stable API error contract for authentication, authorization, validation, not found, conflict, and server failures.

Acceptance criteria:

- Frontend handling can distinguish error categories without parsing free-form text.
- Field validation can be mapped to form fields and non-field errors can be shown globally.
- Version conflict uses HTTP 409 and includes enough stable information to trigger reconciliation.

## Authentication and authorization

### AUTH-001 — Learning login and opaque token

Provide a learning login API that issues an opaque Bearer token, persists its server-side representation in PostgreSQL, and authenticates API requests from that token.

Acceptance criteria:

- Valid credentials return an opaque token that contains no readable user claims.
- An active persisted token authenticates a request; an invalid or revoked token does not.
- The frontend stores the token in localStorage and the documentation warns that XSS can expose it.

### AUTH-002 — Roles

Support `ADMIN`, `MANAGER`, and `MEMBER`.

Acceptance criteria:

- ADMIN can perform all in-scope operations.
- MANAGER can manage projects, customers, properties, and assignees.
- MEMBER can read assigned projects and perform only approved updates on those projects.

### AUTH-003 — Backend enforcement

Treat frontend controls as UX only and perform final authorization in the backend.

Acceptance criteria:

- Direct API requests that bypass the UI are rejected when unauthorized.
- Authorization tests cover role, assignment, and operation conditions.

## Data and core operations

### DATA-001 — Customer/property/project cardinality

One customer has many properties; one property has many projects; one project belongs to exactly one customer and one property; a project cannot span multiple properties.

Acceptance criteria:

- The database and API represent these cardinalities.
- A project cannot be persisted without its one customer and one property.

### DATA-002 — Customer/property consistency

Validate in the backend that a project's property belongs to the selected customer.

Acceptance criteria:

- A mismatched customer/property request is rejected by the API.
- The rule is covered by backend tests.

### DATA-003 — Assignee and login-user relationship

Associate each assignee with a login user.

Acceptance criteria:

- An assignee can be resolved to the user used for authorization.
- Inactive or archived relationships are handled consistently by the backend.

### PRJ-001 — Project management

Provide project list, detail, registration, and update operations.

Acceptance criteria:

- Authorized users can complete all four operations through UI and REST API.
- Input validation and unified API errors are shown without losing recoverable form input.

### PRJ-002 — Customer management

Provide customer list, detail, registration, and update operations.

Acceptance criteria:

- ADMIN and MANAGER can manage customers.
- Referential constraints prevent invalid project/customer relationships.

### PRJ-003 — Property management

Provide property list, detail, registration, and update operations.

Acceptance criteria:

- ADMIN and MANAGER can manage properties under a customer.
- Customer/property consistency is enforced on writes.

### PRJ-004 — Assignee management and multiple assignment

Provide assignee management and allow multiple assignees on one project.

Acceptance criteria:

- ADMIN and MANAGER can manage assignees and project assignments.
- A project can return multiple assignees without duplicates.
- Assignment changes are included in project audit history.

### SEARCH-001 — Project search and list controls

Search by project name, assignee, status, and period; support filtering, sorting, and pagination.

Acceptance criteria:

- Combined conditions are sent to the API and represented in TanStack Query keys.
- Responses include items and pagination metadata.
- Changing conditions produces the correct server-backed result rather than stale cache data.

### ARCH-001 — Non-destructive lifecycle

Do not physically delete major business data; use archive or active state.

Acceptance criteria:

- Normal delete/deactivate operations preserve the record.
- Default lists exclude archived/inactive records unless explicitly requested.
- Existing references remain valid according to the approved archive rules.

## Status, Gantt, Kanban, cache, and audit

### STATUS-001 — Project statuses and transition service

Use `DRAFT`, `PLANNED`, `IN_PROGRESS`, `ON_HOLD`, `COMPLETED`, and `CANCELLED`; validate every transition in a dedicated backend service.

Acceptance criteria:

- The backend rejects a transition not present in the approved transition matrix.
- Frontend behavior does not determine whether a transition is valid.
- Authorized valid transitions update the project and its audit history atomically.

### STATUS-002 — Integer optimistic lock

Maintain an integer `version` and reject stale updates with HTTP 409.

Acceptance criteria:

- Every protected update submits the expected version.
- Successful updates increment version.
- A stale version does not overwrite current data and returns 409.

### GANTT-001 — Project-level date Gantt

Show project-level bars in month and week views, using dates, including weekends, with no holiday or process-level calculation.

Acceptance criteria:

- Month and week modes show the same project dates at their respective scales.
- Bars crossing visible-range boundaries are clipped correctly.
- Month/year and week/year boundary cases are tested.

### GANTT-002 — Calculation/rendering separation

Keep date/range and pixel calculations in frontend pure functions, separate from React rendering.

Acceptance criteria:

- Pixel calculations can be tested without rendering a component.
- The API and database contain dates, not pixel positions.

### KANBAN-001 — Kanban status operation

Allow authorized project status changes from a Kanban view after backend authorization and transition checks.

Acceptance criteria:

- Only backend-approved transitions persist.
- MEMBER operations are restricted to assigned projects and the approved update range.
- Version conflicts are shown and reconciled with server state.

### KANBAN-002 — Optimistic update and rollback

Use TanStack Query to snapshot in `onMutate`, update optimistically, restore cache on failure, and refetch in `onSettled`.

Acceptance criteria:

- A successful request provides immediate UI feedback and settles to server state.
- A failed request restores every affected cached view and displays an error.
- `onSettled` refetches affected server state after both success and failure.

### CACHE-001 — Query key and mutation consistency

Include all selection parameters in query keys and define cache updates/invalidation for each mutation.

Acceptance criteria:

- Search/filter/sort/page changes use distinct cache entries.
- Project mutations reconcile list, detail, Gantt, Kanban, and history caches as applicable.
- Non-retryable business errors are not retried without limit.

### AUDIT-001 — Initial audit scope

Record changes to project basic information, status, date range, and assignee assignments. Detailed history for all customer/property fields is out of scope.

Acceptance criteria:

- Each audit entry identifies target, action, actor, timestamp, and changed values.
- Business update and audit entry commit or roll back together.
- Authorized users can view project history in chronological order.

## Verification

### TEST-001 — Layered automated tests

Use Vitest and React Testing Library for frontend logic/components, pytest for backend services/APIs/database behavior, and Playwright for critical browser flows.

Acceptance criteria:

- Date calculations, authorization, transitions, optimistic rollback, version conflict, and audit atomicity have tests at the lowest effective layer.
- Playwright covers a core project flow, list controls, Gantt switching, Kanban success, rollback failure, and role restrictions.
- Tests document what is mocked and what uses real PostgreSQL.

## Out of scope

- OUT-001: multiple tenants
- OUT-002: billing and contract management
- OUT-003: file attachments
- OUT-004: notifications and email
- OUT-005: holiday calendar calculation
- OUT-006: process/task-level Gantt
- OUT-007: production deployment
- OUT-008: paid or external services

Out-of-scope items are constraints, not implementation requirements, and therefore have no implementation status.

## Unresolved scope interpretation

The career material and `CAREER-SYSTEMS-V1` mention process/progress management. `CONSTRUCTION-V1.0` clearly represents progress through project status and project date range, and explicitly excludes process/task-level Gantt. Whether a separate non-Gantt process/progress model or screen is required is not decided and must not be inferred during implementation.
