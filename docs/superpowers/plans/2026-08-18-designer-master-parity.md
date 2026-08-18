# 2D/3D designer master-parity implementation plan

- [x] Transcribe the `master` designer navigation, stage types, data scope, visible fields,
  and actions into an observable authority matrix.
- [x] Audit current dashboard, work-stage boards/detail, project/task routes, activity tabs,
  archived data, chat, and route guards against that matrix.
- [x] Restore assigned-project status movement using `project.edit` plus object scope.
- [x] Restore assigned-lead note/call/file capabilities and server writes without widening
  ordinary lead mutation scope.
- [x] Preserve delete permissions/time windows while allowing the same assigned activity.
- [x] Run focused and full verification, the web build, and diff hygiene checks.
- [x] Record final evidence in `PROJECT_STATE.md`.
