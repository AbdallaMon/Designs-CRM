# 2D/3D designer master-parity design

## Goal

Preserve the observable `master` behavior for active `DESIGNER_3D` and `DESIGNER_2D`
profiles: the same work-stage data, fields, and actions, independent of the current code
organization and redesigned UI.

## Master-derived authority matrix

| Surface | Visible data | Allowed actions |
|---|---|---|
| Dashboard | The signed-in designer's project metrics | Read only |
| 3D work stages | Assigned `3D_Designer` projects, modification stage, assigned archived projects | Open project/task detail, edit the assigned project fields allowed by the form, move a non-terminal project status, manage assigned-project tasks |
| 2D work stages | Assigned study, final-plan, and quantity projects, plus assigned archived projects | Same assigned-project actions as 3D |
| Work-stage lead activity | The already-scoped lead wrapper; calls remain caller-filtered and files/notes keep the legacy per-project-type narrowing | Add notes, schedule/update calls, upload files, and delete a newly-created visible record within the legacy time window |
| Cross-cutting routes | Chat, notifications, task/project detail reached from the work-stage UI | Use only records allowed by room/project/task scope |

Designers do not gain project assignment/removal, other designers' projects, admin/accounting
surfaces, or ordinary mutation authority over the backing sales lead.

## Confirmed gaps

1. The migrated status action required `project.manage`. Designer profiles intentionally do
   not hold that management permission, so every board drag/status-menu change failed even
   for the assigned designer. `master` allowed the action.
2. The designer detail decorated the lead wrapper with project capabilities. Consequently
   `canAddNote`, `canAddCall`, and `canAddFile` were absent/false, and the ordinary lead
   mutation checker would reject the writes because a designer is project-assigned rather
   than the sales owner of the lead.

## Resolution

- Status movement requires `project.edit` plus project mutation scope and the existing
  non-admin terminal-status lock. Designer assignment/removal remains `project.manage`.
- The lead wrapper receives explicit activity capabilities derived from the viewer's
  permissions and assignment to any returned project.
- Note/call/file writes use a narrowly named activity checker: ordinary lead ownership is
  accepted first; only active 2D/3D designer profiles may fall back to an assignment under
  that lead. This fallback is not used for lead fields, status, offers, payments, meetings,
  or contracts.
- Recent visible note/file/call deletion receives the same designer-assignment fallback;
  the existing action permission and deletion time window remain mandatory.

No Prisma schema, migration, database, PDF, navigation, or API payload shape changes.

## Verification

- Capability tests for assigned/unassigned 2D/3D designers and terminal statuses.
- Activity-scope tests for both profiles and an unassigned denial.
- Generic-delete and note-target scope tests.
- Existing project, lead, task, dashboard, navigation, route-access, chat, and endpoint
  contract suites, followed by the full repository suite and web production build.

