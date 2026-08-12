# Authentication and Authorization

PLAN_VERSION: `CONSTRUCTION-V1.0`

Phase 3 authentication and role foundations plus Phase 6 project/resource authorization are implemented and verified.

## Authentication flow

1. User submits email credentials to `POST /api/v1/auth/login`.
2. Backend validates the persisted user credentials.
3. Backend generates an opaque token and persists the token session in PostgreSQL.
4. Frontend stores the returned token in localStorage.
5. Protected requests send `Authorization: Bearer <token>`.
6. Backend resolves an active token to its user for every protected request.
7. Logout revokes the persisted token session.

The token contains no client-readable identity or role claims. It is generated with `secrets.token_urlsafe(32)`, expires after eight hours, and only its SHA-256 hash is stored. One session row exists per user; re-login replaces it and invalidates the prior raw token. Logout records `revoked_at`. Passwords use Argon2id, and inactive users fail both login and authenticated API access.

## localStorage security note

localStorage is approved only as a learning-oriented design. JavaScript on the same origin can read it, so an XSS vulnerability can expose the Bearer token. The implementation must avoid unsafe HTML injection, apply framework-safe rendering practices, and document this limitation. This plan does not claim that localStorage is the preferred production authentication storage.

## Roles

| Operation family | ADMIN | MANAGER | MEMBER |
|---|---|---|---|
| Project/customer/property/assignee management | All operations | Manage | No general management |
| Read projects | All | All in system scope | Assigned projects only |
| Update projects | Basic fields and all permitted transitions | Basic fields and all permitted transitions | Assigned projects; approved transitions only |
| Archive major data | Allowed | Allowed within managed resources | Not allowed |
| View project history | Allowed | Allowed | Assigned project only |

MEMBER cannot edit project basic fields, assignees, archive state, Customer, Property, or Assignee data. Assignment grants read/history access and only these transitions: `PLANNED → IN_PROGRESS`, `IN_PROGRESS → ON_HOLD`, `ON_HOLD → IN_PROGRESS`, and `IN_PROGRESS → COMPLETED`.

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

Phase 3 provides `require_roles(...)` for endpoint-level role checks. Missing/invalid authentication returns `AUTHENTICATION_REQUIRED` with 401; an authenticated user lacking the required role receives `FORBIDDEN` with 403. Phase 6 applies assignment scope in the Project service, so MEMBER list results contain assigned projects only and unassigned detail/history/actions return 403.

## Status service boundary

All project status changes call a dedicated service that receives actor, project, target status, and expected version. It verifies authorization, the approved transition matrix, and version before updating status and writing AUDIT-001 in one transaction.

The implemented transition matrix is:

- `DRAFT → PLANNED | CANCELLED`
- `PLANNED → IN_PROGRESS | ON_HOLD | CANCELLED`
- `IN_PROGRESS → ON_HOLD | COMPLETED | CANCELLED`
- `ON_HOLD → IN_PROGRESS | CANCELLED`
- `COMPLETED` and `CANCELLED` are terminal

ADMIN and MANAGER may use every listed transition. MEMBER remains limited to the four assigned-project transitions stated above.

## Required tests

- Invalid, revoked, and inactive-user tokens
- Role matrix for ADMIN/MANAGER/MEMBER
- MEMBER unassigned-project denial
- Direct API attempt despite hidden frontend control
- Invalid status transition
- Stale version returning 409 without mutation
- Audit record created only with successful mutation
