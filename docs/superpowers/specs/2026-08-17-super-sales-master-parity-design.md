# SUPER_SALES master-parity design

**Date:** 2026-08-17  
**Baseline:** deployed `master` plus the approved permissions-parity matrix  
**Source of truth:** active `SUPER_SALES` profile; legacy flags are never read

## Intended authority

`SUPER_SALES` is a sales supervisor, not a database administrator. It has:

- full lead visibility and lead workflow authority, including assignment to another sales user;
- visibility of transferred calls and meetings, plus mutation as reminder creator, current lead
  owner, or full-scope sales supervisor;
- global sales dashboard scope and the legacy calendar-month supervisor branch;
- the sales-team user-management surface, limited to non-admin users in the SALES family;
- full project scope and project-management actions, matching the approved parity matrix;
- the legacy admin-gated course, image-session reference-data, and admin-residual permissions
  already granted by `SUPER_SALES_EXTRA_PERMISSIONS`.

It does not gain accounting, audit-log, site-utility, Telegram credential-management, or
base-admin-only destructive authority. Existing object checks, two-day/short deletion windows,
and the explicit lead-delete restriction remain unchanged.

The master sidebar intentionally does not show Work Stages, Reports, Image Session Gallery, or
Website Utilities to `SUPER_SALES`. Current navigation remains identical. Project API scope follows
the previously approved permissions-parity matrix, while the normal UI reaches project data through
lead/deal detail rather than a Work Stages navigation entry.

## Drift being corrected

The current permission-code layer grants the intended supervisor actions, and the lead/project
repositories already expose full scope, but several inner usecases check only `isAdminTier`.
That produces permission-without-behavior failures:

- lead assign/bulk-convert/status and the deals aggregator's `isAdmin` signal;
- project board/detail/list/status, task workflow, and update visibility;
- sales-user profile view/edit and picker queries;
- the dashboard lead-status supervisor signal.

The fix uses explicit, local predicates (`isAdminTier || currentProfileKey === "SUPER_SALES"`)
only on surfaces where master/parity grants supervisor authority. It does not change the global
meaning of `isAdminTier` and does not widen unrelated modules.

## User-directory rule

Admin-tier profiles may honor any requested directory profile. `SUPER_SALES` may honor requested
profiles only inside the SALES family. Other profiles remain restricted to peers sharing one of
their assigned profiles. The convert picker requests the assigned-profile union
`NORMAL_SALES,PRIMARY_SALES`.

## Verification

- unit tests for lead supervisor signals and deal aggregation;
- project/task/update supervisor tests and capability tests;
- sales-only directory and sales-target profile-scope tests;
- dashboard supervisor-side-effect signal test;
- existing permission-map, authorization, scope, and frontend build suites.
