# Data Model

PLAN_VERSION: `CONSTRUCTION-V1.0`

`User`, `AuthTokenSession`, and the Assignee foundation were implemented in Phase 3; Customer, Property, and Project in Phase 4; and ProjectAssignee plus AuditLog in Phase 6. Version and transition rules are enforced by the Phase 6 service.

## Relationship overview

```text
Customer 1 --- * Property
Customer 1 --- * Project
Property 1 --- * Project
Project 1 --- * ProjectAssignee * --- 1 Assignee
User 1 --- 0..1 Assignee
User 1 --- * AuthTokenSession (at most one unrevoked)
Project 1 --- * AuditLog
```

One project has exactly one customer and one property. A project cannot span multiple properties. The selected property must belong to the selected customer, enforced by backend domain validation and supported by database constraints where practical.

## Entities

### User — implemented

- `id`
- unique normalized email and Argon2id password hash
- `role`: `ADMIN | MANAGER | MEMBER`
- active/archive state
- created/updated timestamps

### AuthTokenSession — implemented

- `id`
- `user_id`
- SHA-256 hash of the opaque token; raw token is never persisted
- issued timestamp
- issued timestamp and eight-hour expiration timestamp
- revoked timestamp

A PostgreSQL partial unique index permits at most one unrevoked session per user. Re-login revokes the prior row and creates a new session, preserving evidence that the old raw token was invalidated; logout sets the current row's revoked timestamp.

### Assignee — implemented

- `id`
- `user_id` unique relationship
- display name
- active/archive state
- created/updated timestamps

### Customer — implemented

- `id`
- unique `code` (maximum 30 characters)
- `name` (maximum 100 characters)
- optional `contact_name` (maximum 100 characters)
- optional `phone` (maximum 30 characters)
- optional email-formatted `email`
- `is_active`
- created/updated timestamps

### Property — implemented

- `id`
- `customer_id`
- `name` (maximum 100 characters)
- optional `postal_code` (maximum 10 characters)
- `prefecture` (maximum 20 characters)
- `city` (maximum 100 characters)
- `address_line` (maximum 200 characters)
- `is_active`
- created/updated timestamps

### Project — implemented

- `id`
- unique `code` (maximum 30 characters)
- `name` (maximum 150 characters)
- optional `description`
- `customer_id`
- `property_id`
- `status`: one of the six approved values; defaults to `DRAFT`
- required `start_date`, `end_date` date values
- integer `version`; defaults to `1`
- `is_archived`; defaults to `false`
- created/updated timestamps

`start_date <= end_date` is enforced in both application validation and PostgreSQL. A composite foreign key enforces that the selected property belongs to the selected customer. Phase 6 locks protected writes, compares `expected_version`, increments the version once on success, and returns a structured 409 on mismatch.

### ProjectAssignee — implemented

- `project_id`
- `assignee_id`
- assigned timestamp

The project/assignee pair is unique. Primary-assignee or assignment-role concepts are not yet approved.

### AuditLog — implemented

- `id`
- `project_id`
- actor user ID
- action/category
- JSONB before and after values
- occurred timestamp
- resulting project version

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

Phase 4 exposes no physical-delete API. Customers and properties use `is_active`; projects use `is_archived`. Inactive/archived records are excluded from lists but remain available by ID. Inactive customers/properties cannot be selected for a new project or a changed project reference, while an existing project retains and may continue to submit its unchanged historical references. Reactivation and archive-cascade policy remains unresolved.

## Explicit exclusions

- Tenant model or tenant ID
- Billing/contract entities
- Attachments
- Notifications/email queue
- Holiday calendar
- Process/task entity for Gantt purposes
