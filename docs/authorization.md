# Authentication and Authorization

PLAN_VERSION: `CONSTRUCTION-V1.0`

All authentication and authorization behavior is `NOT_IMPLEMENTED`.

## Authentication flow

1. User submits learning credentials to `POST /api/auth/login`.
2. Backend validates the persisted user credentials.
3. Backend generates an opaque token and persists the token session in PostgreSQL.
4. Frontend stores the returned token in localStorage.
5. Protected requests send `Authorization: Bearer <token>`.
6. Backend resolves an active token to its user for every protected request.
7. Logout revokes the persisted token session.

The token contains no client-readable identity or role claims. Exact token lifetime, rotation, and concurrent-session limits are unresolved.

## localStorage security note

localStorage is approved only as a learning-oriented design. JavaScript on the same origin can read it, so an XSS vulnerability can expose the Bearer token. The implementation must avoid unsafe HTML injection, apply framework-safe rendering practices, and document this limitation. This plan does not claim that localStorage is the preferred production authentication storage.

## Roles

| Operation family | ADMIN | MANAGER | MEMBER |
|---|---|---|---|
| Project/customer/property/assignee management | All operations | Manage | No general management |
| Read projects | All | All in system scope | Assigned projects only |
| Update projects | All permitted transitions/fields | Manage subject to transition/version rules | Assigned projects, approved update range only |
| Archive major data | Allowed | Allowed within managed resources | Not allowed |
| View project history | Allowed | Allowed | Assigned project only |

The exact MEMBER field and transition allowance is unresolved. Until approved, implementation must not infer that assignment grants unrestricted updates.

## Authorization decision order

```text
valid active token
  AND role permits operation family
  AND resource scope permits access
  AND project assignment permits MEMBER access when applicable
  AND current project status permits the operation
  AND expected integer version matches for protected writes
```

The backend is authoritative. Frontend route guards and hidden/disabled controls provide understandable UX but are not a security boundary.

## Status service boundary

All project status changes call a dedicated service that receives actor, project, target status, and expected version. It verifies authorization, the approved transition matrix, and version before updating status and writing AUDIT-001 in one transaction.

The exact transition matrix for `DRAFT`, `PLANNED`, `IN_PROGRESS`, `ON_HOLD`, `COMPLETED`, and `CANCELLED` is intentionally unresolved rather than guessed.

## Required tests

- Invalid, revoked, and inactive-user tokens
- Role matrix for ADMIN/MANAGER/MEMBER
- MEMBER unassigned-project denial
- Direct API attempt despite hidden frontend control
- Invalid status transition
- Stale version returning 409 without mutation
- Audit record created only with successful mutation
