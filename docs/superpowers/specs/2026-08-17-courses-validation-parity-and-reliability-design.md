# Courses validation parity and reliability

**Date:** 2026-08-17

## Goal

Keep the courses application visually equivalent to `AbdallaMon/Design-courses` while making every current admin and learner action use the canonical `/v2/courses` and `/v2/staff-courses` contracts with matching client/server validation and actionable errors.

## Scope

- `courses-web` course, lesson, content, homework, test, question, attempt, dashboard, auth, notification, and upload flows.
- `server/src/modules/courses/{admin-course,staff-course}` routes and Zod validation.
- Contract and focused unit tests.
- No Prisma schema, migration, production database, main `web` UI, or PDF behavior change.

## Findings

1. The mounted URL graph is already canonical and the static endpoint-parity suite is green.
2. Course create, lesson create, content create, access grant, test create, question create, homework create, and attempt create return HTTP `201`, but legacy callers run their success callback only for `status === 200`.
3. Link/PDF/video edit forms initialize their state from full API records and send those records to strict update schemas. Read-only fields such as `id` and `lessonId` therefore produce `422 VALIDATION_ERROR`.
4. A new test can be submitted as published from the UI, while the backend correctly refuses to publish a zero-question test. The UI exposes an impossible action and the backend returns only the generic validation code.
5. The backend accepts several invalid enum/numeric body values through broad string/number unions and can defer failures to Prisma instead of returning a field-level `422`.
6. The frontend error formatter ignores structured Zod `details`, so users see only “Validation error”.
7. The learner answer-save path bypasses the shared submit adapter and does not surface non-2xx errors. Untimed attempts can also be auto-submitted immediately by the timer effect.

## Design

### Success contract

The submit adapter keeps the real HTTP status as `httpStatus` and exposes a stable `success` boolean. For compatibility with the existing courses UI, every successful 2xx response is treated as success, including `201 Created`.

### Payload ownership

Add pure frontend payload builders for each mutable course resource. Builders whitelist editable fields and normalize numeric values. Components never send an object received from the API directly back to a strict mutation endpoint.

### Validation parity

Backend Zod schemas validate the actual Prisma enums and numeric bounds before the usecase. Create and edit schemas are separate where their required fields differ. Strict schemas reject mass-assignment fields. Frontend builders and form guards produce payloads accepted by those schemas.

### Test publication

New tests are always created as drafts. Publishing is an edit action available only after questions exist. Backend publication failures carry structured `details` explaining which field/action is invalid; the frontend displays those details.

### Learner reliability

Answer saves use the same envelope/error semantics as other requests. Untimed tests do not start an auto-submit timer. Timed tests auto-submit only when the countdown reaches zero.

### Verification

- Pure tests parse every frontend payload builder through the real backend Zod schema.
- Validation tests cover enum, numeric, strict-field, and publication cases.
- Existing admin/staff usecase and endpoint-parity tests remain green.
- `courses-web` production build and targeted lint run.
- Browser smoke check covers the login shell and, when local credentials/data are available, the authenticated admin/learner flows.

## Implemented result

- Every mutable courses form now sends a whitelisted resource payload rather than an API record.
- Successful `201 Created` responses execute the same UI close/refetch/redirect behavior as `200 OK` while preserving `httpStatus` for callers that need it.
- Admin and staff course schemas are strict and validate ids, enums, numeric bounds, empty command bodies, question choices, and publication rules before Prisma.
- New tests are drafts; publishing requires at least one valid question and returns/display field-level details when invalid.
- Learner answer saves expose API errors, ordering initialization no longer mutates state during render, untimed attempts validate answers without auto-submitting, and timed attempts submit only at zero.
- The unauthenticated login path no longer reloads itself or pre-emptively refreshes a missing session; its Next image uses the current API and MUI styles use the Next 16 App Router cache provider without hydration errors.
- The user-visible courses structure and assets remain aligned with `AbdallaMon/Design-courses`; this pass changes reliability and feedback rather than replacing the established design.
