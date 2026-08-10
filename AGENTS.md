# Repository Instructions

## Project identity

- Project ID: `CONSTRUCTION-V1`
- Current plan version: `CONSTRUCTION-V1.0`
- Parent plan: `CAREER-SYSTEMS-V1`

## Authoritative documents

- `docs/implementation-plan.md`
- `docs/requirements.md`
- `docs/status.md`
- `docs/decision-log.md`

The remaining files under `docs/` explain the approved plan by concern. If they conflict, stop and report the conflict; do not silently choose one.

## Mandatory plan alignment

Before implementation, audit, or a change proposal:

1. Read this file and all authoritative documents in full.
2. Report the current `PLAN_VERSION`, current phase, and requirement IDs in scope.
3. State allowed and prohibited work for the request.
4. Compare the request with the approved plan.
5. If the request changes `CAREER-SYSTEMS-V1` or the approved `CONSTRUCTION-V1` plan, present it as `PROPOSED_CHANGE` with reason, impact, and alternatives, then wait for explicit approval.

Normal initial design within an unmodified approved scope is not a `PROPOSED_CHANGE`.

## Scope and safety

- Do not change the adopted technology categories or business scope without approval.
- Do not add dependencies, external services, or architecture outside the approved plan.
- Do not push, create a pull request, deploy, or enable automatic GitHub Actions triggers unless explicitly requested.
- Do not connect to paid or external services without explicit approval.
- Preserve user changes and unrelated worktree changes.
- Keep implementation, tests, documentation, requirement mapping, and status synchronized.
- Never mark a requirement complete while its acceptance criteria are failing or unverified.
- Record approved plan changes in `docs/decision-log.md` and update `PLAN_VERSION` only after approval.

## Current implementation gate

The repository is in documentation-only planning. All product requirements are unimplemented. Scaffold creation, dependency installation, Docker construction, migrations, GitHub Actions, commits, and pushes require a later explicit instruction.

## Quiz mode

When conducting a code-reading quiz:

- Inspect current code before each question.
- Ask one question at a time.
- Do not reveal answers or target files before the user's answer.
- Preserve the user's answer verbatim.
- Distinguish repository facts from standards, framework behavior, conventions, and alternatives.
- Update only the designated quiz-progress document unless code changes are explicitly requested.
