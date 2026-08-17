# Reminder duration and shared contract constants — Design

**Date:** 2026-08-17  
**Branch:** `feat/workstage-flow-redesign`  
**Status:** Implemented

## Problem

Reminder delivery uses 15-minute, 4-hour, and 12-hour query windows. The email templates
currently print the window name, so a meeting created two hours before its start can be
sent by the 4-hour sweep while incorrectly telling the recipient that four hours remain.

The application also duplicates access-contract strings across the server and both Next
applications. Examples include profile-filter URLs containing `NORMAL_SALES` directly,
frontend mirrors of permission strings, and raw API message/error codes. These copies can
drift from the backend and from `@dms/shared`.

## Decisions

1. Reminder query windows and notified flags remain unchanged. Only the human-readable
   remaining duration is calculated from `scheduledTime - now` at send time.
2. Remaining time is rounded to the nearest whole hour as requested; any positive value
   below one rounded hour is displayed as `1 Hour`. The formatter is singular-aware and
   injected with `now` in tests.
3. Both client and staff reminder templates use the same formatter. The scheduled clock
   time and timezone formatting remain unchanged.
4. `@dms/shared` exposes identifiers as `PROFILES.<KEY>` and exposes the permission lists
   separately as `PROFILE_PERMISSION_DEFAULTS.<KEY>`. This removes the previous overload
   where `PROFILES` unexpectedly contained arrays.
5. `PROFILE_KEYS` is derived from the identifier values, while permission resolution reads
   `PROFILE_PERMISSION_DEFAULTS`. This is a naming-only refactor; grants do not change.
6. `web` and `courses-web` declare `@dms/shared` as a workspace dependency. Local mirrors
   of access constants are removed or converted into compatibility re-exports.
7. Production source must not embed profile identifiers, retained `UserRole` identifiers,
   shared permission codes, or API message/error codes. These values come from shared
   exports. A repository audit script enforces this boundary.
8. Human UI/email copy, route fragments, MIME types, CSS tokens, and database workflow
   values are not message/access codes and remain local. Backend responses and `AppError`
   values remain code-first and sourced from the shared message-code catalog.

## Safety boundaries

- No schema or migration change.
- No reminder delivery-window change.
- No authorization grant or scope change.
- No PDF-generation change.
- Existing uncommitted work is preserved; the migration is mechanical and verified by
  focused tests, the repository contract audit, the full test suite, and both builds.
