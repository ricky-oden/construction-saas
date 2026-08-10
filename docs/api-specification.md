# API Specification

PLAN_VERSION: `CONSTRUCTION-V1.0`

All endpoints are planned and `NOT_IMPLEMENTED`. Paths are the `CONSTRUCTION-V1.0` initial contract; detailed schemas remain to be finalized before implementation.

## Common conventions

- Base path: `/api`
- Protected requests: `Authorization: Bearer <opaque-token>`
- JSON request and response bodies
- Dates: ISO `YYYY-MM-DD`
- Optimistically locked writes include expected integer `version`
- A stale version returns HTTP `409 Conflict`
- Authentication failure returns 401; authorization failure returns 403
- Validation returns 422 with a consistent field/non-field error shape
- Archived/inactive major records are excluded by default

## Authentication

| Method | Path | Purpose | Requirement |
|---|---|---|---|
| POST | `/api/auth/login` | Validate learning credentials and issue opaque token | AUTH-001 |
| POST | `/api/auth/logout` | Revoke current persisted token | AUTH-001 |
| GET | `/api/auth/me` | Return authenticated user, role, and assignee identity | AUTH-001, AUTH-002 |

The raw opaque token is returned to the client, while its server-side representation is stored in PostgreSQL. Exact lifetime and concurrent-session policy are unresolved.

## Projects

| Method | Path | Purpose | Requirement |
|---|---|---|---|
| GET | `/api/projects` | Search/filter/sort/page visible projects | PRJ-001, SEARCH-001 |
| POST | `/api/projects` | Register project | PRJ-001, DATA-002 |
| GET | `/api/projects/{project_id}` | Get authorized project detail | PRJ-001 |
| PATCH | `/api/projects/{project_id}` | Update project fields with expected version | PRJ-001, STATUS-002, AUDIT-001 |
| POST | `/api/projects/{project_id}/archive` | Archive project | ARCH-001 |
| PUT | `/api/projects/{project_id}/assignees` | Replace/update assignment set with expected version | PRJ-004, STATUS-002, AUDIT-001 |
| POST | `/api/projects/{project_id}/status-transitions` | Request status transition with expected version | STATUS-001, STATUS-002, KANBAN-001 |
| GET | `/api/projects/{project_id}/history` | Get authorized project audit history | AUDIT-001 |

Planned list query parameters:

- `name`
- `assignee_id`
- `status`
- `period_from`
- `period_to`
- `sort`
- `order`
- `page`
- `page_size`
- optional `include_archived` for authorized management use

Planned list response metadata includes `items`, `page`, `page_size`, and `total`.

## Customers

| Method | Path | Purpose | Requirement |
|---|---|---|---|
| GET | `/api/customers` | List/search customers | PRJ-002 |
| POST | `/api/customers` | Register customer | PRJ-002 |
| GET | `/api/customers/{customer_id}` | Get customer | PRJ-002 |
| PATCH | `/api/customers/{customer_id}` | Update customer | PRJ-002 |
| POST | `/api/customers/{customer_id}/archive` | Archive customer subject to references | ARCH-001 |

## Properties

| Method | Path | Purpose | Requirement |
|---|---|---|---|
| GET | `/api/properties` | List/search properties, optionally by customer | PRJ-003 |
| POST | `/api/properties` | Register property under customer | PRJ-003, DATA-002 |
| GET | `/api/properties/{property_id}` | Get property and customer relation | PRJ-003 |
| PATCH | `/api/properties/{property_id}` | Update property | PRJ-003 |
| POST | `/api/properties/{property_id}/archive` | Archive property subject to references | ARCH-001 |

## Assignees

| Method | Path | Purpose | Requirement |
|---|---|---|---|
| GET | `/api/assignees` | List/search assignees | DATA-003, PRJ-004 |
| POST | `/api/assignees` | Register assignee linked to login user | DATA-003, PRJ-004 |
| GET | `/api/assignees/{assignee_id}` | Get assignee | PRJ-004 |
| PATCH | `/api/assignees/{assignee_id}` | Update assignee | PRJ-004 |
| POST | `/api/assignees/{assignee_id}/archive` | Deactivate/archive assignee | ARCH-001 |

## Authorization summary

- ADMIN: all in-scope endpoints and operations
- MANAGER: manage projects, customers, properties, and assignees
- MEMBER: project read only when assigned; project updates only within the still-to-be-approved field/status range
- Backend checks apply even when the frontend hides a route or control

## Error body direction

A unified error response will contain a stable application code, human-readable message, optional field errors, and optional conflict metadata. Exact field names are unresolved and must be frozen before endpoint implementation.
