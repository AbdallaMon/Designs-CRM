# Designer details, Image Sessions, and profile-switch landing — implementation plan

- [x] Add failing frontend tests for designer `/dashboard/deals/:id` route access and the
  requested per-profile landing destinations.
- [x] Add failing backend tests for assigned-designer Image Session read/manage scope and
  unassigned denial.
- [x] Verify and pin `master` parity for historical designer Calls and Attachments.
- [x] Keep the redesigned work-stage workspace but default designer preview to Details and
  expose a clear View Lead Details action.
- [x] Allow the exact assignment-scoped designer lead-detail page through the client guard.
- [x] Return refreshed `/auth/me` data from `refetchMe` and route successful switches using a
  pure profile-landing resolver.
- [x] Add an assignment-aware lead scope checker and use it for Image Session list/manage;
  surface request errors instead of a false empty state.
- [x] Use the same assignment-aware view scope for durable lead-file/note downloads, with
  regression coverage for allowed and denied access.
- [x] Repair the generic error page Server/Client boundary while preserving its safe message
  presentation.
- [x] Run focused and adjacent regression suites, the web build, and `git diff --check`.
- [x] Record the completed behavior and verification in `PROJECT_STATE.md`.
