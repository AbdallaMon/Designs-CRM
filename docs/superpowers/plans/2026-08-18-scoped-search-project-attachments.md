# Scoped search, project visibility, and durable attachments implementation plan

1. Pin the `master` search and project visibility findings in tests and this design.
2. Narrow sales lead autocomplete to owned leads, return deterministic unique lead rows, and
   render the lead-details identity pattern with stale-request protection.
3. Route client-lead-keyed project reads through lead scope for sales while preserving assigned
   project scope for designers/executors and all existing mutation checks.
4. Add authenticated stable note/file attachment routes that resolve the parent lead and redirect
   to a newly signed content URL; switch Telegram messages to those routes.
5. Centralize image/document presentation and adopt it in lead files, contract drawings, contract
   PDFs, and PDF utility cards.
6. Run focused tests and builds, inspect the final diff, and record the verified result in
   `PROJECT_STATE.md`.
