# Screen List

PLAN_VERSION: `CONSTRUCTION-V1.0`

The Phase 3 authentication screens and the Phase 4 Customer/Property/Project list, create, and detail/update screens are implemented. Search, assignment, Gantt, Kanban, and audit UI remain `NOT_IMPLEMENTED`.

| ID | Route candidate | Screen | Main requirements | Roles |
|---|---|---|---|---|
| SCR-001 | `/login` | Login | AUTH-001 | Public — implemented |
| INF-001 | `/account` | Protected authentication/role foundation | AUTH-001–003 | Authenticated — implemented |
| SCR-002 | `/projects` | Project list/search/pagination | PRJ-001, SEARCH-001, CACHE-001 | ADMIN, MANAGER — implemented through Phase 5 |
| SCR-003 | `/projects/new` | Project registration | PRJ-001, DATA-001, DATA-002 | ADMIN, MANAGER — implemented |
| SCR-004 | `/projects/[projectId]` | Project detail/update | PRJ-001, DATA-001, DATA-002 | ADMIN, MANAGER — implemented |
| SCR-006 | `/customers` | Customer list | PRJ-002 | ADMIN, MANAGER — implemented |
| SCR-006A | `/customers/new` | Customer registration | PRJ-002 | ADMIN, MANAGER — implemented |
| SCR-007 | `/customers/[customerId]` | Customer detail/update | PRJ-002 | ADMIN, MANAGER — implemented |
| SCR-008 | `/properties` | Property list | PRJ-003, DATA-002 | ADMIN, MANAGER — implemented |
| SCR-008A | `/properties/new` | Property registration | PRJ-003, DATA-002 | ADMIN, MANAGER — implemented |
| SCR-009 | `/properties/[propertyId]` | Property detail/update | PRJ-003, DATA-002 | ADMIN, MANAGER — implemented |
| SCR-010 | `/assignees` | Assignee management | DATA-003, PRJ-004, ARCH-001 | ADMIN, MANAGER |
| SCR-011 | `/schedule` | Project Gantt | GANTT-001, GANTT-002, SEARCH-001 | ADMIN, MANAGER, MEMBER within scope |
| SCR-012 | `/kanban` | Project Kanban | STATUS-001, STATUS-002, KANBAN-001, KANBAN-002 | ADMIN, MANAGER, MEMBER within scope |

## Shared screen behavior

- Authentication-required routes send the opaque Bearer token with API calls.
- Frontend authorization determines visibility and disabled state, but a hidden control never substitutes for backend checks.
- Project list conditions are URL-backed and restore across history navigation and reload. Name/date fields apply on submit; select, sorting, page size, and page controls update the URL and API selection. Loading, error, empty, current-condition, reset, and pagination states are explicit.
- React Hook Form manages editable form state and validation messages.
- Unified API errors distinguish authentication, authorization, validation, not found, version conflict, and server failure.
- Major business records use archive/active operations rather than physical-delete UX.

## Planned later project-detail sections

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
