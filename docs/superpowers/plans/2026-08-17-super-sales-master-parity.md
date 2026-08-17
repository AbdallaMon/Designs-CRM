# SUPER_SALES master-parity implementation plan

1. Pin the master-derived authority matrix and intentional denials in tests/docs.
2. Make lead workflow admin signals include the active `SUPER_SALES` profile and correct the
   inverted deals aggregation flag.
3. Align project, task, and update list/detail/workflow branches with their already-full
   repository scope and permission grants.
4. Allow sales-only user directory/profile management for `SUPER_SALES`, while retaining target
   hierarchy and field allow-lists.
5. Align the dashboard lead-status supervisor signal; retain calendar day-view and deletion
   restrictions that master did not elevate.
6. Run focused tests, full server/shared tests, lint/build, then document the verified result in
   `PROJECT_STATE.md`.
