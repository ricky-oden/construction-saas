# Audit Log

PLAN_VERSION: `CONSTRUCTION-V1.0`

Requirement: AUDIT-001

Status: `IMPLEMENTED_AND_VERIFIED` for the initial Project scope

## Initial audit scope

Record changes to:

- Project basic information
- Project status
- Project start/end dates
- Project assignee additions/removals

Detailed field-by-field history for customers and properties is out of scope for `CONSTRUCTION-V1.0`.

## Entry content

- Audit entry ID
- Project ID
- Category/action
- Actor user ID
- Occurred timestamp
- Structured JSONB `before_values` and `after_values`
- Resulting project version

Passwords, raw Bearer tokens, credential representations, and other secrets must never be recorded.

## Transaction rule

The project mutation and audit insert use the same SQLAlchemy/PostgreSQL transaction. Both commit or both roll back. A rejected authorization, invalid transition, or version conflict produces no successful-change audit entry.

## Assignment history

Assignment changes record the assignee identity and whether it was added or removed. Bulk replacement must retain enough detail to explain the difference between the previous and resulting assignment sets.

## Read behavior

- History is read through the project history endpoint.
- ADMIN and MANAGER can view in-scope project history.
- MEMBER can view history only for an assigned project.
- Entries are returned chronologically by occurrence time and ID.

## Archive interaction

Archiving a project is recorded as a separate project action. Detailed customer/property history remains excluded even when those records are deactivated.

## Unresolved details

- Retention period
- Pagination size for history
- Whether selected actions require a user-entered reason
