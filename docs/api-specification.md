# API Specification

PLAN_VERSION: `CONSTRUCTION-V1.0`

The Phase 2 DB-backed health endpoint is implemented. All business endpoints remain planned and `NOT_IMPLEMENTED`; their detailed schemas remain to be finalized before implementation.

## Common conventions

- Base path: `/api/v1`
- Protected requests: `Authorization: Bearer <opaque-token>`
- JSON request and response bodies
- Dates: ISO `YYYY-MM-DD`
- Optimistically locked writes include expected integer `version`
- A stale version returns HTTP `409 Conflict`
- Authentication failure returns 401; authorization failure returns 403
- Validation returns 422 with a consistent field/non-field error shape
- Archived/inactive major records are excluded by default

## Phase 2 infrastructure

| Method | Path | Purpose | Status |
|---|---|---|---|
| GET | `/api/v1/health` | Verify the backend process and PostgreSQL using `SELECT 1` | Implemented and verified |

Successful response:

```json
{"status": "ok", "database": "ok"}
```

If PostgreSQL is unavailable, the endpoint returns HTTP 503 with code `DATABASE_UNAVAILABLE` in the common envelope. The response does not expose the connection URL, host credentials, stack trace, or internal database exception.

## Authentication

| Method | Path | Purpose | Requirement |
|---|---|---|---|
| POST | `/api/v1/auth/login` | Validate learning credentials and issue opaque token | AUTH-001 |
| POST | `/api/v1/auth/logout` | Revoke current persisted token | AUTH-001 |
| GET | `/api/v1/auth/me` | Return authenticated user, role, and assignee identity | AUTH-001, AUTH-002 |

The raw opaque token is returned to the client, while its server-side representation is stored in PostgreSQL. Exact lifetime and concurrent-session policy are unresolved.

## Projects

| Method | Path | Purpose | Requirement |
|---|---|---|---|
| GET | `/api/v1/projects` | Search/filter/sort/page visible projects | PRJ-001, SEARCH-001 |
| POST | `/api/v1/projects` | Register project | PRJ-001, DATA-002 |
| GET | `/api/v1/projects/{project_id}` | Get authorized project detail | PRJ-001 |
| PATCH | `/api/v1/projects/{project_id}` | Update project fields with expected version | PRJ-001, STATUS-002, AUDIT-001 |
| POST | `/api/v1/projects/{project_id}/archive` | Archive project | ARCH-001 |
| PUT | `/api/v1/projects/{project_id}/assignees` | Replace/update assignment set with expected version | PRJ-004, STATUS-002, AUDIT-001 |
| POST | `/api/v1/projects/{project_id}/status-transitions` | Request status transition with expected version | STATUS-001, STATUS-002, KANBAN-001 |
| GET | `/api/v1/projects/{project_id}/history` | Get authorized project audit history | AUDIT-001 |

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
| GET | `/api/v1/customers` | List/search customers | PRJ-002 |
| POST | `/api/v1/customers` | Register customer | PRJ-002 |
| GET | `/api/v1/customers/{customer_id}` | Get customer | PRJ-002 |
| PATCH | `/api/v1/customers/{customer_id}` | Update customer | PRJ-002 |
| POST | `/api/v1/customers/{customer_id}/archive` | Archive customer subject to references | ARCH-001 |

## Properties

| Method | Path | Purpose | Requirement |
|---|---|---|---|
| GET | `/api/v1/properties` | List/search properties, optionally by customer | PRJ-003 |
| POST | `/api/v1/properties` | Register property under customer | PRJ-003, DATA-002 |
| GET | `/api/v1/properties/{property_id}` | Get property and customer relation | PRJ-003 |
| PATCH | `/api/v1/properties/{property_id}` | Update property | PRJ-003 |
| POST | `/api/v1/properties/{property_id}/archive` | Archive property subject to references | ARCH-001 |

## Assignees

| Method | Path | Purpose | Requirement |
|---|---|---|---|
| GET | `/api/v1/assignees` | List/search assignees | DATA-003, PRJ-004 |
| POST | `/api/v1/assignees` | Register assignee linked to login user | DATA-003, PRJ-004 |
| GET | `/api/v1/assignees/{assignee_id}` | Get assignee | PRJ-004 |
| PATCH | `/api/v1/assignees/{assignee_id}` | Update assignee | PRJ-004 |
| POST | `/api/v1/assignees/{assignee_id}/archive` | Deactivate/archive assignee | ARCH-001 |

## Authorization summary

- ADMIN: all in-scope endpoints and operations
- MANAGER: manage projects, customers, properties, and assignees
- MEMBER: project read only when assigned; project updates only within the still-to-be-approved field/status range
- Backend checks apply even when the frontend hides a route or control

## Common error body

Phase 1 fixes the shared wire shape used by frontend and backend:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "field_errors": [
      {
        "field": "query.sample",
        "message": "Input should be a valid integer.",
        "type": "int_parsing"
      }
    ],
    "conflict": null
  }
}
```

- `code`: stable machine-readable application code
- `message`: safe client-facing summary
- `field_errors`: zero or more field/location errors
- `conflict`: optional conflict metadata; exact 409 content remains a later-phase decision

404 and unexpected 500 responses use the same shape. Unexpected internal exception text is logged server-side and is not returned to the client.
