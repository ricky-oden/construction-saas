# Kanban Optimistic Update

PLAN_VERSION: `CONSTRUCTION-V1.0`

Requirements: STATUS-001, STATUS-002, KANBAN-001, KANBAN-002, CACHE-001

Status: `NOT_IMPLEMENTED`

## Preconditions

Kanban work begins only after project APIs, backend authorization, the status-transition service, unified errors, integer versioning, and project query keys are established.

## Mutation sequence

1. User requests a status move.
2. Frontend performs its UX-level permission/transition check.
3. `onMutate` cancels affected queries.
4. `onMutate` snapshots every affected project list, Kanban, detail, and other relevant cache entry.
5. Frontend places the project optimistically in the target column using the expected current `version`.
6. Backend rechecks token, role, assignment scope, transition, and version.
7. On success, frontend applies the authoritative response where appropriate.
8. On error, frontend restores the complete snapshot and displays the failure.
9. `onSettled` invalidates/refetches affected queries after both success and failure.

## Cache scope

The mutation context must account for:

- Kanban queries with active filters
- Project list queries whose status/filter/order membership may change
- Project detail
- Gantt queries if status display is present
- Project audit history after successful mutation

Central feature hooks define this behavior; individual components must not each invent their own invalidation rules.

## Backend transaction

```text
authenticate actor
-> authorize project scope and operation
-> load current project/version
-> validate requested transition in dedicated service
-> compare expected integer version
-> update status and increment version
-> insert audit entry
-> commit
```

A stale version returns HTTP 409 and does not overwrite server data. The frontend restores its snapshot, reports the conflict, and then refetches server state.

## Failure categories

- 401: token invalid/revoked; restore and initiate approved session-expiry UX
- 403: role or assignment does not allow operation; restore and explain denial
- 409: version conflict; restore, explain conflict, refetch authoritative state
- 422: request or transition invalid; restore and show business error
- 5xx/network: restore, show retryable failure, refetch on settlement when reachable

## Required tests

- Immediate optimistic column movement
- Successful response and version increment
- Network/API failure restoring all affected caches
- Unauthorized operation restoring state
- Invalid transition restoring state
- 409 conflict preserving server winner and refetching it
- Multiple filtered query keys not retaining contradictory project status
