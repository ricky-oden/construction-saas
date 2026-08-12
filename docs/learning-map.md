# CONSTRUCTION-V1 Learning Map

PLAN_VERSION: `CONSTRUCTION-V1.0`

```text
Browser / Chromium
  ├─ login + localStorage token (learning-only XSS exposure)
  ├─ React Hook Form editable state
  ├─ TanStack Query keys, cache, mutation lifecycle
  ├─ Project search URL state
  ├─ Gantt pure date/pixel geometry
  └─ Kanban snapshot -> optimism -> rollback/refetch
           |
           | same-origin /api/v1
           v
Next.js App Router + rewrite
           |
           v
FastAPI router + Pydantic
  ├─ authentication dependency
  ├─ ADMIN / MANAGER / MEMBER authorization
  ├─ Customer/Property consistency
  ├─ fixed search/sort/pagination mapping
  ├─ status transition service
  └─ unified 401/403/404/409/422/500 envelope
           |
           v
SQLAlchemy service + transaction
  ├─ FOR UPDATE + integer version
  ├─ ProjectAssignee many-to-many
  └─ business mutation + AuditLog atomicity
           |
           v
PostgreSQL 16 + Alembic
```

## Learning checkpoints

| Checkpoint | Read | Run |
|---|---|---|
| UI state versus server state | Project list, `businessKeys`, Query Provider | Project URL/cache Vitest |
| Authentication boundary | AuthProvider, API client, auth dependencies/service | auth Vitest + pytest + logout E2E |
| ORM constraints | business models/migrations/services | PostgreSQL business pytest |
| Concurrency | `_locked_project`, `_check_version`, AuditLog | concurrent transition pytest + 409 E2E |
| Optimism | Kanban hook and status cache helpers | deferred Vitest + failure/409 E2E |
| Date visualization | Gantt geometry and schedule page | boundary Vitest + month/week E2E |
| Whole system | Compose rewrite and E2E override | `scripts/verify-phase9.sh` |

## Cross-project map

- TEA manufacturing master/lot/status flows are closest to Customer/Property/Project relations and lifecycle controls.
- EC catalog/list/filter/order-state flows are closest to Project list URL state, pagination, query keys, and API client behavior.
- Construction-specific study should focus on assignment-scoped MEMBER access, project date bars, row locking, 409 reconciliation, and optimistic multi-cache rollback.

## Safety boundary

The project is single-tenant and learning-only. It has no billing, contracts, attachments, notifications, holiday engine, process/task Gantt, production deployment, or paid external integration. Demo credentials are local examples only. Real secrets, production data, and production security claims do not belong here.
