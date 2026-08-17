# Browser E2E Remediation Design

## Scope

This pass fixes the eleven issues reproduced during local role-by-role and public-client browser testing. The deployed `master` behavior remains the compatibility baseline except for explicit correctness and security fixes.

## Locked decisions

- `ADMIN` is the highest profile and outranks `SUPER_ADMIN`.
- `SUPER_ADMIN` may manage lower profiles but may not view or mutate an `ADMIN` account through management endpoints.
- Lead detail responses expose only the minimum assigned-user identity fields; credentials, hashes, tokens, salary, and internal account fields never leave the server.
- Public contract pages must fail safely when contract boilerplate has not been seeded. PDF generation behavior stays frozen and is not changed.
- Public registration honors the requested language and shows client-side email validation feedback.
- Completed public registrations are restored from a capability-protected, minimal server status read;
  a URL step alone is never trusted as proof of completion.
- Upload/capability success messages and the upload-progress UI resolve in Arabic or English.
- Designer navigation uses routes that actually exist in the current frontend.
- UI mutations refresh every dependent lead list and pool count.
- Runtime-warning fixes are behavior-preserving framework compatibility updates.

## Changes

1. Replace broad Prisma relation includes in lead details with explicit safe selects and add regression coverage.
2. Apply profile-aware management visibility and object scope: ADMIN can manage SUPER_ADMIN; SUPER_ADMIN cannot manage ADMIN.
3. Correct designer work-stage and archived-project navigation URLs.
4. Guard public contract rendering when utility content is unavailable and remove the provider hydration mismatch without touching PDF services.
5. Fix the external `eng-ahmed` registration language bootstrap and accessible email error rendering.
   Restore completed registrations on refresh and keep the new-registration action language-aware.
6. Refresh lead pool summaries after assignment, correct route-specific page titles, and use assignment-specific dialog copy.
7. Resolve the runtime warnings reproduced in the tested CRM and public-lead paths.

## Verification

- Focused Vitest coverage for lead DTO/repository selection, user hierarchy, and navigation.
- Frontend lint/tests for changed components, followed by workspace tests/builds.
- Browser re-test of admin/super-admin visibility, lead detail payload, public registration, assignment counters, designer links, reports/deals headings, and the public contract page.
- Registration-status responses expose only `id`, `completed`, and `item`, require the matching
  short-lived funnel capability, and return 401 without it.
