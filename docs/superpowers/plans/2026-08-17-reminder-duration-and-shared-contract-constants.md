# Reminder duration and shared contract constants — Implementation plan

**Date:** 2026-08-17  
**Branch:** `feat/workstage-flow-redesign`

1. Add failing tests for actual rounded reminder duration in both client and staff mail.
2. Extract one reminder-duration formatter and use it from both reminder templates without
   changing the cron query buckets or notified fields.
3. Split shared profile identifiers from profile permission defaults; update shared helpers,
   seeds, scripts, and tests without changing any grant.
4. Add `@dms/shared` to both frontend workspaces, replace local permission/profile mirrors,
   and migrate access literals in `server/src`, `web/src`, and `courses-web/src`.
5. Replace remaining raw backend response/error codes with their shared message-code
   constants and add missing catalog entries only when a real code is already in use.
6. Add an `npm` audit command that rejects future duplicated access/API contract strings.
7. Run focused mail/shared/contract tests, the audit command, the full Vitest suite, both
   production builds, targeted lint, and `git diff --check`.
8. Record the completed behavior and verification evidence in `PROJECT_STATE.md`.

