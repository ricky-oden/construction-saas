# Data Model

PLAN_VERSION: `CONSTRUCTION-V1.0`

All models are planned and `NOT_IMPLEMENTED`.

## Relationship overview

```text
Customer 1 --- * Property
Customer 1 --- * Project
Property 1 --- * Project
Project 1 --- * ProjectAssignee * --- 1 Assignee
User 1 --- 1 Assignee
User 1 --- * AuthToken
Project 1 --- * AuditLog
```

One project has exactly one customer and one property. A project cannot span multiple properties. The selected property must belong to the selected customer, enforced by backend domain validation and supported by database constraints where practical.

## Planned entities

### User

- `id`
- login identifier and password representation
- `role`: `ADMIN | MANAGER | MEMBER`
- active/archive state
- created/updated timestamps

### AuthToken

- `id`
- `user_id`
- server-side opaque-token representation
- issued timestamp
- expiration timestamp if a lifetime is approved
- revoked timestamp

The implementation should avoid storing a directly reusable raw token when a one-way token hash can satisfy server-side persistence and lookup. The exact representation is finalized with AUTH-001 implementation; the token session itself remains stored in PostgreSQL.

### Assignee

- `id`
- `user_id` unique relationship
- display and business identity fields to be finalized
- active/archive state
- created/updated timestamps

### Customer

- `id`
- customer code/name and business fields to be finalized
- active/archive state
- created/updated timestamps

### Property

- `id`
- `customer_id`
- property name/address and business fields to be finalized
- active/archive state
- created/updated timestamps

### Project

- `id`
- project name and business fields to be finalized
- `customer_id`
- `property_id`
- `status`: one of the six approved values
- `start_date`, `end_date` as date values
- integer `version`
- active/archive state
- created/updated timestamps

`start_date <= end_date` is required when both dates are present. Whether both dates are always mandatory is unresolved.

### ProjectAssignee

- `project_id`
- `assignee_id`
- assignment metadata to be finalized
- assigned timestamp

The project/assignee pair is unique. Primary-assignee or assignment-role concepts are not yet approved.

### AuditLog

- `id`
- `project_id`
- actor user ID
- action/category
- changed values or before/after representation
- occurred timestamp
- project version and optional request correlation identifier

## Integrity rules

- DATA-001: project has one customer and one property.
- DATA-002: project's property belongs to project's customer.
- DATA-003: assignee links to a login user.
- PRJ-004: project/assignee is many-to-many without duplicate links.
- STATUS-001: status uses only approved values; transition validity belongs to the service.
- STATUS-002: protected writes compare and increment integer version.
- ARCH-001: normal business lifecycle preserves major records.
- AUDIT-001: business mutation and audit insert share a transaction.

## Archive behavior

Major business records are not physically deleted through normal operations. A consistent archive or active-state representation will be chosen during schema implementation. Reactivation rules, archive cascades, and whether referenced records can be archived remain unresolved.

## Explicit exclusions

- Tenant model or tenant ID
- Billing/contract entities
- Attachments
- Notifications/email queue
- Holiday calendar
- Process/task entity for Gantt purposes
