# Designer lead details, Image Sessions, and profile-switch landing

## Goal

Restore the useful `master` outcomes for designer work without reverting the redesigned
work-stage UI or weakening the current permission model:

- a designer can clearly open the assigned lead details from a work-stage card;
- the redesigned keyed detail workspace remains, but opens on **Details** like `master`,
  with **Work** still available;
- assigned designers holding the existing Image Session permission can list and manage
  every Image Session belonging to that project lead;
- switching profiles lands on the profile's primary working page.

## Approved behavior

### Designer lead details

- Keep the redesigned card, cockpit, keyed sections, project page, and direct preview eye.
- Rename the preview affordance to **View Lead Details** so it is discoverable.
- Keep that affordance visible for every in-scope card, including Admin and Super Sales;
  record/project scope, not a designer-only role check, controls availability.
- Keep the Kanban header action group non-shrinking. Profiles that can access Image Sessions
  use its compact icon trigger in cards so it cannot push View Lead Details off-screen; full
  Image Session buttons remain on detail/dialog surfaces.
- Open designer previews on the existing **Details** section; do not remove **Work**.
- Permit the exact designer detail route `/dashboard/deals/:leadId` through the client route
  guard. The page already renders the assignment-scoped `PreviewWorkStage`; the server remains
  authoritative and denies unassigned leads.

### Image Sessions

- Keep the existing `image_session.session.view/manage` permission gates.
- Keep the existing per-lead query: all sessions for that lead, newest first.
- Extend lead scope only for an active 2D/3D designer assigned to a project under that lead.
  This is an assignment-scoped fallback, not ordinary lead ownership or mutation authority.
- Preserve the `master` UI exposure: the work-stage Image Session button remains visible to
  3D designers, not 2D designers. The backend fallback safely supports either assigned
  designer profile because both already hold the permission code.
- Do not render a denied request as an empty successful list; show the resolved error.

### Existing Calls and Attachments parity

The `master` query was checked directly and its exact visibility is preserved:

- an assigned **3D designer sees all lead files/notes**, including older Sales uploads;
- an assigned **2D designer sees only their own files/notes**;
- 2D and 3D designers see only calls assigned to themselves, not historical Sales calls.

The current query already matches those rules, so no authorization widening is made. Focused
query-shape tests pin both the 3D all-file result and the 2D/call ownership narrowing.

When one of those returned file/note records is opened through
`/v2/files/attachments/:type/:id`, the download authorization uses the same assigned-project
fallback. An assigned 2D/3D designer may open an attachment belonging to that project lead;
an unassigned designer remains denied. The attachment still must be a canonical stored record,
and the endpoint continues to issue only a short-lived signed content URL.

### Error page

- Preserve the friendly message-code presentation and safe query normalization.
- Keep the Next.js error route server-rendered, but mark the MUI/Next-Link presentation as a
  Client Component so no function component crosses the Server-to-Client boundary.

### Profile switching

After the switch succeeds and `/auth/me` is refreshed:

| Active profile | Landing |
|---|---|
| `DESIGNER_3D` | `/dashboard/work-stages` |
| `DESIGNER_2D` | first Work stages sub-link, currently `/dashboard/work-stages/study` |
| `NORMAL_SALES`, `PRIMARY_SALES`, `SUPER_SALES` | `/dashboard/deals` |
| Other profiles | first backend-provided navigation tab, then `/dashboard` fallback |

The destination is derived from the refreshed profile/navigation payload, not legacy role
columns or local storage.

## Security invariants

- No new permission code or profile grant.
- No role-only backend authorization and no wildcard access.
- Unassigned designers remain denied Image Sessions and designer lead detail data.
- Unassigned users remain denied project-lead attachment downloads.
- Ordinary lead fields, contracts, offers, payments, and sales ownership remain unchanged.
- No schema, migration, database, PDF, or production change.

## Verification

- Pure frontend tests for profile landing and designer detail route access.
- Image Session usecase tests: assigned designer read/manage allow; unassigned denial; ordinary
  lead scope remains the first path.
- Existing route-access, image-session, designer/project, and navigation suites.
- Durable attachment authorization and generic error presentation tests.
- Main web production build and diff hygiene.
