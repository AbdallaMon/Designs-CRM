# Sales directory, user state, and transferred reminders — Design

**Date:** 2026-08-17  
**Branch:** `feat/workstage-flow-redesign`  
**Status:** Approved by reported behavior; implementation in progress

## Problem

Four connected regressions affect lead assignment and user management:

1. The convert/assign picker requests only `NORMAL_SALES`, so a user holding
   `PRIMARY_SALES` is omitted.
2. Saving profile assignments hard-reloads the browser instead of updating React state.
3. The generic user edit response contains identity fields only and replaces the complete
   management row, temporarily dropping `userProfiles` and `currentProfile` in the UI.
4. A transferred lead's existing calls and meetings are filtered and authorized by their
   original creator only. The new lead owner cannot see them in the lead-page queues and is
   rejected when updating them. `SUPER_SALES` is also incorrectly rejected by the inner
   creator-only guard because it has full lead scope without being a database admin-tier profile.

The global error handler then attempts to serialize errors even after another response path has
already committed headers, producing `ERR_HTTP_HEADERS_SENT` noise.

## Decisions

- The assign picker uses assigned-profile membership, not the active profile, and includes users
  holding either `NORMAL_SALES` or `PRIMARY_SALES`. `SUPER_SALES` is not included in this picker.
- Profile save updates the affected row locally; it never calls `window.location.reload()`.
- Identity edits merge their response into the existing user row so relational profile state is
  preserved until the next normal data fetch.
- A call/meeting belongs operationally to both its creator and its lead's current owner.
  Mutation requires the route permission plus one of: full lead scope (`ADMIN`, `SUPER_ADMIN`,
  `SUPER_SALES`), current lead ownership, or reminder creator ownership.
- Staff reminder queues use creator OR current-lead-owner scope. This keeps transferred reminders
  visible to the new owner while preserving the original creator's responsibility history.
- `SUPER_SALES` retains full lead scope via `currentProfileKey`; no legacy sales flags or role-only
  authorization are introduced.
- The error handler delegates with `next(error)` when `res.headersSent` is already true.
- No Prisma schema, migration, PDF behavior, or endpoint names change.

## Verification

- Repository test for multi-profile directory queries.
- User-state helper tests for profile assignment and identity edits.
- Reminder tests covering creator, transferred current owner, full-scope `SUPER_SALES`, and denial.
- Reminder-list query tests covering creator-or-current-owner filtering.
- Error-handler test for an already-sent response.
- Focused lint/tests, full server suite, endpoint parity, and the web production build.

