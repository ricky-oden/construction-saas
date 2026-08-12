# Requirements Traceability

PLAN_VERSION: `CONSTRUCTION-V1.0`

Status vocabulary: `PLANNED`, `IMPLEMENTED`, `VERIFIED`, `PARTIAL`, `NOT_IMPLEMENTED`, `NOT_APPLICABLE`.

| Requirement | Final status | Primary implementation | Primary verification |
|---|---|---|---|
| ENV-001 | VERIFIED | `frontend/package.json`, `frontend/Dockerfile`, `backend/Dockerfile`, `compose.yaml` | `scripts/verify-phase9.sh`: runtime production builds and container inspection |
| ENV-002 | VERIFIED | `backend/requirements.txt`, `backend/requirements-dev.txt`, backend Docker stages | `scripts/verify-phase9.sh`: production imports reject pytest/Ruff/httpx; development pytest/Ruff pass |
| ENV-003 | VERIFIED | `scripts/verify-phase9.sh`, `.github/workflows/manual-quality.yml` | full local script pass; workflow YAML/trigger/command static inspection (remote not run) |
| UI-001 | VERIFIED | `frontend/src/components/ui`, business forms, `frontend/src/app/assignees/page.tsx` | `foundation-form.test.tsx`, `customer-form.test.tsx`, `project-form.test.tsx`, `assignees/page.test.tsx` |
| API-001 | VERIFIED | `backend/app/api/errors.py`, `frontend/src/lib/api/errors.ts` | `backend/tests/test_errors.py`, auth/business/conflict pytest, `frontend/src/app/kanban/page.test.tsx` |
| AUTH-001 | VERIFIED | `backend/app/auth`, auth models, `frontend/src/auth/auth-provider.tsx`, API storage/client | `backend/tests/test_auth.py`, `auth-provider.test.tsx`, `client.test.ts`, Playwright login/logout flow |
| AUTH-002 | VERIFIED | `Role`, backend auth dependencies, frontend gates and transition candidates | `test_auth.py`, `test_phase6_workflow.py`, Playwright management/MEMBER flows |
| AUTH-003 | VERIFIED | `get_current_user`, role dependencies, Project assignment scope checks | direct 401/403 cases in `test_auth.py`/`test_phase6_workflow.py`; Playwright MEMBER API assertions |
| DATA-001 | VERIFIED | `backend/app/models/business.py`, revision `20260812_02` | PostgreSQL constraints and CRUD in `backend/tests/test_business_api.py` |
| DATA-002 | VERIFIED | Project reference validation in `backend/app/services/business.py` | mismatch/inactive reference cases in `test_business_api.py` |
| DATA-003 | VERIFIED | User/Assignee relation in auth models and authorization resolution | `test_auth.py`, `test_phase6_workflow.py`, `assignees/page.test.tsx` |
| PRJ-001 | VERIFIED | Project API/service/form/pages | `test_business_api.py`; `project-form.test.tsx`; Playwright CRUD/search/detail flows |
| PRJ-002 | VERIFIED | Customer API/service/form/pages | `test_business_api.py`; `customer-form.test.tsx`; Playwright management CRUD flow |
| PRJ-003 | VERIFIED | Property API/service/form/pages | `test_business_api.py`; Playwright management CRUD/consistency flow |
| PRJ-004 | VERIFIED | Assignee APIs, `/assignees`, ProjectAssignee, Project workflow UI | `test_phase6_workflow.py`; `assignees/page.test.tsx`; Playwright assignment/history flow |
| SEARCH-001 | VERIFIED | `project-search.ts`, query-key factory, fixed SQL mappings in business service | `test_project_search.py`, `project-search.test.ts`, `projects/page.test.tsx`, Playwright combined controls |
| ARCH-001 | VERIFIED | `is_active`, `is_archived`, archive service, absence of DELETE routes | default-scope/retained-reference/archive cases in `test_business_api.py` and `test_phase6_workflow.py` |
| STATUS-001 | VERIFIED | `transition_project` and approved matrix in backend/frontend transition modules | transition matrix cases in `test_phase6_workflow.py`; workflow/Kanban Vitest; Playwright status flows |
| STATUS-002 | VERIFIED | `_locked_project`, `_check_version`, versioned schemas | concurrent/stale cases in `test_phase6_workflow.py`; workflow/Kanban Vitest; Playwright real 409 |
| GANTT-001 | VERIFIED | `frontend/src/app/schedule/page.tsx`, authorized Project overlap API | `date-geometry.test.ts`, `schedule/page.test.tsx`, overlap cases in `test_project_search.py`, Playwright Gantt flow |
| GANTT-002 | VERIFIED | `frontend/src/gantt/date-geometry.ts` pure functions | `frontend/src/gantt/date-geometry.test.ts` boundary/pixel tests; API schema inspection |
| KANBAN-001 | VERIFIED | `/kanban`, transition candidates, existing status API | role/version pytest, `kanban/page.test.tsx`, Playwright success/MEMBER flows |
| KANBAN-002 | VERIFIED | `useStatusTransition`, `frontend/src/kanban/status-cache.ts` | deferred rollback cases in `kanban/page.test.tsx`; Playwright success/500/409 flows |
| CACHE-001 | VERIFIED | `frontend/src/business/query-keys.ts` and centralized status reconciliation | query/cache Vitest (`projects/page.test.tsx`, `status-cache.test.ts`); Playwright server reconciliation |
| AUDIT-001 | VERIFIED | AuditLog model, `_audit`, history API/UI | atomic rollback/content cases in `test_phase6_workflow.py`; Playwright multiple-assignee history |
| TEST-001 | VERIFIED | pytest, Vitest/RTL, `frontend/e2e/critical-flows.spec.ts` | `scripts/verify-phase9.sh`: 112 pytest, 86 Vitest, 8 Chromium tests |

The eight `OUT-*` entries are scope constraints, not part of the 26 implementation requirements. They are `NOT_APPLICABLE` to implementation status and remain absent.
