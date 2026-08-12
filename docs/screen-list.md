# Screen List

PLAN_VERSION: `CONSTRUCTION-V1.0`

The Phase 3 login and authentication-foundation account screen are implemented. Business screens remain `NOT_IMPLEMENTED`.

| ID | Route candidate | Screen | Main requirements | Roles |
|---|---|---|---|---|
| SCR-001 | `/login` | Login | AUTH-001 | Public — implemented |
| INF-001 | `/account` | Protected authentication/role foundation | AUTH-001–003 | Authenticated — implemented |
| SCR-002 | `/projects` | Project list | PRJ-001, SEARCH-001, CACHE-001 | ADMIN, MANAGER, MEMBER within scope |
| SCR-003 | `/projects/new` | Project registration | PRJ-001, DATA-001, DATA-002 | ADMIN, MANAGER |
| SCR-004 | `/projects/[id]` | Project detail | PRJ-001, PRJ-004, AUDIT-001 | ADMIN, MANAGER, assigned MEMBER |
| SCR-005 | `/projects/[id]/edit` | Project update | PRJ-001, STATUS-002, AUDIT-001 | ADMIN, MANAGER; MEMBER only in approved range |
| SCR-006 | `/customers` | Customer list/management | PRJ-002, SEARCH-001, ARCH-001 | ADMIN, MANAGER |
| SCR-007 | `/customers/[id]` | Customer detail | PRJ-002, PRJ-003 | ADMIN, MANAGER |
| SCR-008 | `/properties` | Property list/management | PRJ-003, DATA-002, ARCH-001 | ADMIN, MANAGER |
| SCR-009 | `/properties/[id]` | Property detail | PRJ-003, DATA-002 | ADMIN, MANAGER |
| SCR-010 | `/assignees` | Assignee management | DATA-003, PRJ-004, ARCH-001 | ADMIN, MANAGER |
| SCR-011 | `/schedule` | Project Gantt | GANTT-001, GANTT-002, SEARCH-001 | ADMIN, MANAGER, MEMBER within scope |
| SCR-012 | `/kanban` | Project Kanban | STATUS-001, STATUS-002, KANBAN-001, KANBAN-002 | ADMIN, MANAGER, MEMBER within scope |

## Shared screen behavior

- Authentication-required routes send the opaque Bearer token with API calls.
- Frontend authorization determines visibility and disabled state, but a hidden control never substitutes for backend checks.
- Project search conditions include project name, assignee, status, and period; list screens also support filtering, sorting, and pagination.
- React Hook Form manages editable form state and validation messages.
- Unified API errors distinguish authentication, authorization, validation, not found, version conflict, and server failure.
- Major business records use archive/active operations rather than physical-delete UX.

## Project detail sections

- Basic information
- Customer and property
- Date range and status
- Multiple assignees
- Integer version metadata needed for protected updates
- Project change history for AUDIT-001

## Gantt screen

- Switch month/week views.
- Move the visible period backward and forward.
- Include weekends and omit holiday-specific treatment.
- Render project bars only; no process/task rows.

## Kanban screen

- Group projects by the six approved statuses.
- Give immediate optimistic feedback for an attempted transition.
- Restore affected cache and show the error when mutation fails.
- Refetch after settlement and treat the backend result as authoritative.

## Unresolved screen details

- Whether create/edit is a full page or modal
- Exact initial landing route
- Exact MEMBER-editable fields and disabled-state messages
- Default list page size/sort
- Gantt initial range and week-start convention
- Whether archived records use a separate page or a list filter
