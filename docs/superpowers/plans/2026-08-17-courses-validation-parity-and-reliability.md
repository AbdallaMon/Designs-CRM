# Courses validation parity and reliability implementation plan

- [x] Add frontend course payload builders and success/error helpers.
- [x] Update course, lesson, content, homework, test, question, and attempt callers to send whitelisted payloads and accept all successful 2xx responses.
- [x] Prevent impossible zero-question publication and show actionable validation details.
- [x] Tighten admin/staff course Zod schemas to real enums, required create fields, numeric bounds, and strict bodies.
- [x] Add cross-layer payload/schema tests plus focused frontend helper and backend validation tests.
- [x] Run focused tests, endpoint parity, full course-related suite, lint/build, Next runtime diagnostics, and an unauthenticated browser smoke check.
- [x] Record the completed result and evidence in `PROJECT_STATE.md`.

Authenticated browser mutation testing requires a local test account and seeded course data; payload/schema compatibility is covered directly by the cross-layer tests instead.
